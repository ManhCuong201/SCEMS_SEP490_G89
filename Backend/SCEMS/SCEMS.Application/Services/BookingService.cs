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

        // 3. Validation: Overlaps
        // ExistingStart < NewEnd && ExistingEnd > NewStart
        var newStart = dto.TimeSlot;
        var newEnd = dto.TimeSlot.AddHours(dto.Duration);

        var conflictingBooking = _unitOfWork.Bookings.GetAll()
            .Where(b => b.RoomId == dto.RoomId && b.Status != BookingStatus.Rejected)
            .ToList() // Client evaluation for complex date math if needed, but simple comparison works in SQL usually
            .Where(b => b.TimeSlot < newEnd && b.TimeSlot.AddHours(b.Duration) > newStart)
            .Any();

        if (conflictingBooking)
        {
             // Check if it's pending? Requirement says: "if not booked then show a book button, if this room already have someone send book request before then above the book button should show how many requests currently on this slot"
             // This implies multiple pending requests are allowed? 
             // "After confirm the request will be send to the booking management staff, he will decide to accept or reject."
             // "Every slot from the real time is bookable if not already booked"
             // Usually "booked" means Accepted. "Pending" means someone asked.
             // If I allow multiple pending requests, then I shouldn't block creation here if the existing one is Pending.
             // But if there is an ACCEPTED booking, I must block.
             
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

        return _mapper.Map<List<BookingResponseDto>>(bookings);
    }
}
