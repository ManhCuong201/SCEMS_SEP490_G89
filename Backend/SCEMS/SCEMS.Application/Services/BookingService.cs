using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Booking;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class BookingService : IBookingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly BookingSettings _bookingSettings;

    public BookingService(IUnitOfWork unitOfWork, IMapper mapper, IOptions<BookingSettings> bookingSettings)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _bookingSettings = bookingSettings.Value;
    }

    public async Task<PaginatedResult<BookingResponseDto>> GetBookingsAsync(PaginationParams @params, Guid? userId = null)
    {
        var query = _unitOfWork.Bookings.GetAll()
            .Include(b => b.Room)
            .Include(b => b.RequestedByAccount)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(b => b.RequestedBy == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            // Search by Room Name
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(b => b.Room != null && b.Room.RoomName.ToLower().Contains(search));
        }

        // Default sort by TimeSlot descending
        query = query.OrderByDescending(b => b.TimeSlot);

        var total = query.Count();
        var items = query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .ToList();

        var dtos = _mapper.Map<List<BookingResponseDto>>(items);

        return new PaginatedResult<BookingResponseDto>
        {
            Items = dtos,
            Total = total,
            PageIndex = @params.PageIndex,
            PageSize = @params.PageSize
        };
    }

    public async Task<BookingResponseDto?> GetBookingByIdAsync(Guid id)
    {
        var booking = await _unitOfWork.Bookings.GetAll()
            .Include(b => b.Room)
            .Include(b => b.RequestedByAccount)
            .FirstOrDefaultAsync(b => b.Id == id);

        return booking != null ? _mapper.Map<BookingResponseDto>(booking) : null;
    }

    public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, Guid userId)
    {
        // 1. Validation: Constraints
        // Start Time from Settings
        if (dto.TimeSlot.Hour < _bookingSettings.StartHour || dto.TimeSlot.Hour >= _bookingSettings.EndHour)
        {
            throw new InvalidOperationException($"Booking start time must be between {_bookingSettings.StartHour}:00 and {_bookingSettings.EndHour}:00.");
        }
        
        // Duration check (assuming Duration is in hours)
        var expectedDurationHours = _bookingSettings.SlotDurationMinutes / 60;
        if (dto.Duration != expectedDurationHours)
        {
             throw new InvalidOperationException($"Booking duration must be exactly {expectedDurationHours} hour(s).");
        }

        // 2. Validation: Room exists
        var room = await _unitOfWork.Rooms.GetByIdAsync(dto.RoomId);
        if (room == null)
            throw new InvalidOperationException("Room not found.");

        if (room.Status != RoomStatus.Available)
            throw new InvalidOperationException("Room is not available for booking.");

        // 3. Validation: Overlaps with other bookings
        var newStart = dto.TimeSlot;
        var newEnd = dto.TimeSlot.AddHours(dto.Duration);

        var conflictingBooking = _unitOfWork.Bookings.GetAll()
            .Where(b => b.RoomId == dto.RoomId && b.Status != BookingStatus.Rejected)
            .ToList()
            .Where(b => b.TimeSlot < newEnd && b.TimeSlot.AddHours(b.Duration) > newStart)
            .Any();
            
        // 4. Validation: Overlaps with Teaching Schedule
        // Check if there is any class in the same room on the same date that overlaps in time.
        // Booking TimeSlot is DateTime. Teaching_Schedule uses Date + StartTime + EndTime.
        
        var date = newStart.Date;
        var reqStartTime = newStart.TimeOfDay;
        var reqEndTime = newEnd.TimeOfDay;

        // Note: This query may need client-side evaluation if DB doesn't support time comparison directly on some providers,
        // but recent EF Core + MySQL providers handle TimeSpan comparisons well.
        var hasClass = _unitOfWork.TeachingSchedules.GetAll()
             .Where(ts => ts.RoomId == dto.RoomId && ts.Date == date)
             .ToList() // Fetch schedules for the day to memory to safely compare times if provider has issues, or optimize by projecting.
             .Any(ts => ts.StartTime < reqEndTime && ts.EndTime > reqStartTime);

        if (hasClass)
        {
             throw new InvalidOperationException("Room is occupied by a class at this time.");
        }

        if (conflictingBooking)
        {
             var acceptedBooking = _unitOfWork.Bookings.GetAll()
                .Where(b => b.RoomId == dto.RoomId && b.Status == BookingStatus.Approved)
                .ToList()
                .Where(b => b.TimeSlot < newEnd && b.TimeSlot.AddHours(b.Duration) > newStart)
                .Any();

             if (acceptedBooking)
                 throw new InvalidOperationException("This slot is already booked.");
        }

        var booking = new Booking
        {
            RoomId = dto.RoomId,
            RequestedBy = userId,
            TimeSlot = dto.TimeSlot,
            Duration = dto.Duration,
            Reason = dto.Reason,
            Status = BookingStatus.Pending
        };

        await _unitOfWork.Bookings.AddAsync(booking);
        await _unitOfWork.SaveChangesAsync();

        return await GetBookingByIdAsync(booking.Id) ?? throw new InvalidOperationException("Failed to retrieve created booking");
    }

    public async Task<BookingResponseDto?> UpdateStatusAsync(Guid id, BookingStatus status)
    {
        var booking = await _unitOfWork.Bookings.GetByIdAsync(id);
        if (booking == null) return null;

        booking.Status = status;
        
        // If approved, reject all other pending requests for the same slot?
        if (status == BookingStatus.Approved)
        {
             var start = booking.TimeSlot;
             var end = booking.TimeSlot.AddHours(booking.Duration);
             
             var conflicting = _unitOfWork.Bookings.GetAll()
                .Where(b => b.RoomId == booking.RoomId && b.Id != booking.Id && b.Status == BookingStatus.Pending)
                .ToList()
                .Where(b => b.TimeSlot < end && b.TimeSlot.AddHours(b.Duration) > start)
                .ToList();
            
             foreach(var conflict in conflicting)
             {
                 conflict.Status = BookingStatus.Rejected;
                 _unitOfWork.Bookings.Update(conflict);
             }
        }

        _unitOfWork.Bookings.Update(booking);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<BookingResponseDto>(booking);
    }

    public async Task<List<BookingResponseDto>> GetRoomScheduleAsync(Guid roomId, DateTime startDate, DateTime endDate)
    {
        var bookings = await _unitOfWork.Bookings.GetAll()
            .Where(b => b.RoomId == roomId && b.TimeSlot >= startDate && b.TimeSlot <= endDate && b.Status != BookingStatus.Rejected)
            .Include(b => b.RequestedByAccount)
            .OrderBy(b => b.TimeSlot)
            .ToListAsync();

        var bookingDtos = _mapper.Map<List<BookingResponseDto>>(bookings);

        // Fetch Teaching Schedules for the same period
        // Teaching_Schedule has Date + StartTime/EndTime. 
        // We need to match Date >= startDate.Date and Date <= endDate.Date
        
        var schedules = await _unitOfWork.TeachingSchedules.GetAll()
            .Where(ts => ts.RoomId == roomId && ts.Date >= startDate.Date && ts.Date <= endDate.Date)
            .ToListAsync();

        foreach (var schedule in schedules)
        {
            var startDateTime = schedule.Date.Add(schedule.StartTime);
            var endDateTime = schedule.Date.Add(schedule.EndTime);
            
            // Map to DTO
            bookingDtos.Add(new BookingResponseDto
            {
                Id = schedule.Id,
                RoomId = schedule.RoomId,
                RoomName = schedule.Room?.RoomName ?? "",
                RequestedBy = Guid.Empty,
                RequestedByName = schedule.LecturerName,
                TimeSlot = startDateTime,
                EndTime = endDateTime,
                Duration = (int)(endDateTime - startDateTime).TotalHours, 
                Reason = $"Class: {schedule.Subject} ({schedule.ClassCode})",
                Status = BookingStatus.Approved.ToString(), 
                CreatedAt = schedule.Date
            });
        }

        return bookingDtos.OrderBy(b => b.TimeSlot).ToList();
    }

    public async Task<BookingResponseDto> CreateRoomChangeRequestAsync(CreateRoomChangeRequestDto dto, Guid userId)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
        if (account == null || account.Role != AccountRole.Lecturer)
        {
            throw new UnauthorizedAccessException("Only Lecturers can request room changes.");
        }

        var bookingDto = new CreateBookingDto
        {
            RoomId = dto.NewRoomId,
            TimeSlot = dto.TimeSlot,
            Duration = dto.Duration,
            Reason = $"[Room Change Request] From {dto.OriginalRoomId} to {dto.NewRoomId}. Reason: {dto.Reason}"
        };

        return await CreateBookingAsync(bookingDto, userId);
    }
}
