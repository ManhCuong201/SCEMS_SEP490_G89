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
    private readonly IConfigurationService _configurationService;
    private readonly INotificationService _notificationService;

    public BookingService(IUnitOfWork unitOfWork, IMapper mapper, IConfigurationService configurationService, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _configurationService = configurationService;
        _notificationService = notificationService;
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

        // Auto-reject expired pending bookings (ONLY after their end time has passed)
        var now = DateTime.Now;
        var expiredPendingGeneral = await _unitOfWork.Bookings.GetAll()
            .Where(b => b.Status == BookingStatus.Pending)
            .ToListAsync();
        
        var toReject = expiredPendingGeneral.Where(b => b.TimeSlot.AddHours(b.Duration) < now).ToList();

        if (toReject.Any())
        {
            foreach(var b in toReject)
            {
                b.Status = BookingStatus.Rejected;
                _unitOfWork.Bookings.Update(b);
            }
            await _unitOfWork.SaveChangesAsync();
        }

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

        if (booking != null && booking.Status == BookingStatus.Pending && booking.TimeSlot.AddHours(booking.Duration) < DateTime.Now)
        {
            booking.Status = BookingStatus.Rejected;
            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.SaveChangesAsync();
        }

        return booking != null ? _mapper.Map<BookingResponseDto>(booking) : null;
    }

    public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, Guid userId, bool skipDurationCheck = false)
    {
        // 1. Validation: Constraints
        var errors = new List<string>();

        // Past Time Check (allowing actions if the slot ends in the future)
        var endTime = dto.TimeSlot.AddHours(dto.Duration);
        if (endTime < DateTime.Now)
        {
            errors.Add("Không thể mượn hoặc đổi phòng vào thời gian đã qua.");
        }

        // Start Time Check (Rough check before fetching config if we want to fail really early, 
        // but we'll use the default values for the early check)
        var reqStartHour = dto.TimeSlot.Hour;
        var reqEndHour = dto.TimeSlot.AddHours(dto.Duration).Hour;
        
        // duration check (non-DB part)
        if (!skipDurationCheck && dto.Duration <= 0)
        {
             errors.Add("Thời lượng mượn phòng không hợp lệ.");
        }

        if (errors.Any())
        {
            throw new InvalidOperationException(string.Join("|", errors));
        }

        // Fetch dynamic settings
        var startHour = await _configurationService.GetValueAsync("Booking.StartHour", 7);
        var endHour = await _configurationService.GetValueAsync("Booking.EndHour", 22);
        var slotDuration = await _configurationService.GetValueAsync("Booking.SlotDurationMinutes", 60);
        var maxDuration = await _configurationService.GetValueAsync("Booking.MaxDurationHours", 4);
        var maxPerWeek = await _configurationService.GetValueAsync("Booking.MaxPerWeek", 5);

        // Validation with Dynamic Config
        if (reqStartHour < startHour || reqStartHour >= endHour || (reqEndHour > endHour && dto.TimeSlot.AddHours(dto.Duration).Minute > 0))
        {
            errors.Add($"Thời gian mượn phòng phải trong khoảng từ {startHour}:00 đến {endHour}:00.");
        }
        
        if ((dto.Duration * 60) % slotDuration != 0)
        {
            errors.Add($"Thời lượng mượn phòng phải chính xác theo khung giờ ({slotDuration} phút).");
        }

        if (!skipDurationCheck)
        {
            if (dto.Duration > maxDuration)
            {
                 errors.Add($"Thời lượng mượn phòng tối đa cho phép là {maxDuration} giờ.");
            }
            
            var expectedDurationHours = slotDuration / 60;
            if (slotDuration % 60 == 0 && dto.Duration != expectedDurationHours)
            {
                // Only enforce exact single slot if config implies fixed slots
                // But for now, let's keep it flexible or use the specific check the user-intended
            }
        }

        if (errors.Any())
        {
            throw new InvalidOperationException(string.Join("|", errors));
        }

        // Frequency Limit Check (UC 022)
        var startOfWeek = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek + (int)DayOfWeek.Monday);
        var endOfWeek = startOfWeek.AddDays(7);
        
        var weeklyBookingCount = await _unitOfWork.Bookings.GetAll()
            .CountAsync(b => b.RequestedBy == userId && b.CreatedAt >= startOfWeek && b.CreatedAt < endOfWeek && b.Status != BookingStatus.Rejected);
            
        if (weeklyBookingCount >= maxPerWeek)
        {
            errors.Add($"Bạn đã đạt tới giới hạn mượn phòng tối đa ({maxPerWeek} lần) trong tuần này.");
        }

        // 2. Validation: Room exists
        var room = await _unitOfWork.Rooms.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            errors.Add("Không tìm thấy phòng.");
        }
        else if (room.Status != RoomStatus.Available)
        {
            errors.Add("Phòng hiện không khả dụng để mượn.");
        }

        // 3. Validation: Overlaps
        var newStart = dto.TimeSlot;
        var newEnd = dto.TimeSlot.AddHours(dto.Duration);
        var date = newStart.Date;
        var reqStartTime = newStart.TimeOfDay;
        var reqEndTime = newEnd.TimeOfDay;

        if (room != null)
        {
            // Check conflicts in Bookings (other approved or pending bookings for same room)
            var conflictingBooking = _unitOfWork.Bookings.GetAll()
                .Where(b => b.RoomId == dto.RoomId && b.Status != BookingStatus.Rejected)
                .ToList()
                .Any(b => b.TimeSlot < newEnd && b.TimeSlot.AddHours(b.Duration) > newStart);

            if (conflictingBooking)
            {
                errors.Add("Phòng này đã có người khác mượn hoặc đang chờ duyệt trong thời gian này.");
            }
                
            // Check conflicts in Teaching Schedule for the room
            var hasClass = _unitOfWork.TeachingSchedules.GetAll()
                 .Where(ts => ts.RoomId == dto.RoomId && ts.Date == date)
                 .ToList()
                 .Any(ts => ts.StartTime < reqEndTime && ts.EndTime > reqStartTime);

            if (hasClass)
            {
                 errors.Add("Phòng này đã được xếp lịch dạy lớp khác vào thời gian này.");
            }
        }

        // 5. Check Lecturer/User Conflict (User cannot be in two places at once)
        var userHasClass = _unitOfWork.TeachingSchedules.GetAll()
            .Where(ts => ts.LecturerId == userId.ToString() && ts.Date == date)
            .ToList()
            .Any(ts => ts.StartTime < reqEndTime && ts.EndTime > reqStartTime);

        if (userHasClass)
        {
            errors.Add("Bạn đã có lịch dạy lớp khác vào thời gian này.");
        }

        var userHasBooking = _unitOfWork.Bookings.GetAll()
            .Where(b => b.RequestedBy == userId && b.Status == BookingStatus.Approved)
            .ToList()
            .Any(b => b.TimeSlot < newEnd && b.TimeSlot.AddHours(b.Duration) > newStart);

        if (userHasBooking)
        {
            errors.Add("Bạn đã có một yêu cầu mượn phòng khác được phê duyệt vào thời gian này.");
        }

        if (errors.Any())
        {
            throw new InvalidOperationException(string.Join("|", errors));
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
        var booking = await _unitOfWork.Bookings.GetAll()
            .Include(b => b.Room)
            .FirstOrDefaultAsync(b => b.Id == id);
        if (booking == null) return null;

        booking.Status = status;
        
        // If approved, reject all other pending requests for the same slot?
        if (status == BookingStatus.Approved || status == BookingStatus.CheckedIn)
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

             // Handle Schedule Change Request
             if (!string.IsNullOrEmpty(booking.Reason) && booking.Reason.StartsWith("[Schedule Change Request] ScheduleId: "))
             {
                 var prefixLen = "[Schedule Change Request] ScheduleId: ".Length;
                 var dotIndex = booking.Reason.IndexOf('.', prefixLen);
                 if (dotIndex > prefixLen)
                 {
                     var scheduleIdStr = booking.Reason.Substring(prefixLen, dotIndex - prefixLen).Trim();
                     if (Guid.TryParse(scheduleIdStr, out var scheduleId))
                     {
                         var schedule = await _unitOfWork.TeachingSchedules.GetByIdAsync(scheduleId);
                         if (schedule != null)
                         {
                             schedule.RoomId = booking.RoomId;
                             schedule.Date = booking.TimeSlot.Date;
                             schedule.StartTime = booking.TimeSlot.TimeOfDay;
                             schedule.EndTime = booking.TimeSlot.AddHours(booking.Duration).TimeOfDay;
                             _unitOfWork.TeachingSchedules.Update(schedule);

                             // Notify students in the class
                             if (!string.IsNullOrEmpty(schedule.ClassCode))
                             {
                                 var studentIds = await _unitOfWork.ClassStudents.GetAll()
                                     .Where(cs => cs.Class != null && cs.Class.ClassCode == schedule.ClassCode && cs.StudentId.HasValue)
                                     .Select(cs => cs.StudentId.Value)
                                     .ToListAsync();

                                 foreach (var studentId in studentIds)
                                 {
                                     await _notificationService.SendNotificationAsync(studentId, 
                                         "Thay đổi lịch học", 
                                         $"Lịch học môn {schedule.Subject} đã được đổi sang phòng {booking.Room?.RoomName} lúc {booking.TimeSlot:HH:mm dd/MM/yyyy}.",
                                         "/schedule");
                                 }
                             }
                         }
                     }
                 }
             }
        }

        _unitOfWork.Bookings.Update(booking);
        await _unitOfWork.SaveChangesAsync();

        // --- NOTIFICATIONS ---
        var isChangeRequest = !string.IsNullOrEmpty(booking.Reason) && (booking.Reason.Contains("[Room Change Request]") || booking.Reason.Contains("[Schedule Change Request]"));
        var requestTypeStr = isChangeRequest ? "Yêu cầu đổi phòng/lịch" : "Yêu cầu đặt phòng";
        // Results Notification to Requester
        var statusStr = status switch
        {
            BookingStatus.Approved => "được phê duyệt",
            BookingStatus.Rejected => "bị từ chối",
            BookingStatus.CheckedIn => "đã check-in (bắt đầu sử dụng)",
            BookingStatus.Completed => "đã hoàn thành",
            BookingStatus.Cancelled => "đã huỷ",
            _ => status.ToString().ToLower()
        };
        await _notificationService.SendNotificationAsync(booking.RequestedBy, 
            $"Kết quả: {requestTypeStr}", 
            $"{requestTypeStr} cho phòng {booking.Room?.RoomName} vào {booking.TimeSlot:dd/MM/yyyy} đã {statusStr}.",
            "/my-bookings");

        // Audit Log for Admin
        await _notificationService.SendToRoleAsync(AccountRole.Admin, 
            $"Nhật ký hệ thống: {requestTypeStr}", 
            $"{requestTypeStr} của tài khoản ID {booking.RequestedBy} cho phòng {booking.Room?.RoomName} đã {statusStr}.",
            "/admin/bookings");

        if (status == BookingStatus.Approved)
        {
            // Security Notification
            await _notificationService.SendToRoleAsync(AccountRole.Guard, 
                "Lịch trình phòng mới được phê duyệt", 
                $"Phòng {booking.Room?.RoomName} đã được phê duyệt sử dụng vào lúc {booking.TimeSlot:HH:mm dd/MM/yyyy}.",
                "/admin/booking-board");

            // Asset Staff Notification
            await _notificationService.SendToRoleAsync(AccountRole.AssetStaff, 
                "Yêu cầu chuẩn bị thiết bị", 
                $"Phòng {booking.Room?.RoomName} đã được phê duyệt sử dụng vào lúc {booking.TimeSlot:HH:mm dd/MM/yyyy}. Vui lòng kiểm tra và chuẩn bị thiết bị nếu cần.",
                "/admin/booking-board");
        }

        return _mapper.Map<BookingResponseDto>(booking);
    }

    public async Task<List<BookingResponseDto>> GetRoomScheduleAsync(Guid roomId, DateTime startDate, DateTime endDate)
    {
        var now = DateTime.Now;
        var pendingRoom = await _unitOfWork.Bookings.GetAll()
            .Where(b => b.RoomId == roomId && b.Status == BookingStatus.Pending)
            .ToListAsync();

        var toReject = pendingRoom.Where(b => b.TimeSlot.AddHours(b.Duration) < now).ToList();

        if (toReject.Any())
        {
            foreach(var b in toReject)
            {
                b.Status = BookingStatus.Rejected;
                _unitOfWork.Bookings.Update(b);
            }
            await _unitOfWork.SaveChangesAsync();
        }

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
                Duration = (int)Math.Round((endDateTime - startDateTime).TotalHours), 
                Reason = $"Class: {schedule.Subject} ({schedule.ClassCode})",
                Status = BookingStatus.Approved.ToString(), 
                CreatedAt = schedule.Date
            });
        }

        return bookingDtos.OrderBy(b => b.TimeSlot).ToList();
    }

    public async Task<List<BookingResponseDto>> GetBookingsByDateAsync(DateTime date)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1);

        // 1. Fetch bookings targeting THIS day
        var bookings = await _unitOfWork.Bookings.GetAll()
            .Include(b => b.Room)
            .Include(b => b.RequestedByAccount)
            .Where(b => b.TimeSlot >= startOfDay && b.TimeSlot < endOfDay && b.Status != BookingStatus.Rejected)
            .ToListAsync();

        // 2. Fetch "Outgoing" change requests: Pending bookings that might target OTHER days
        // but were initiated from classes on THIS day.
        // We find these by checking if any pending booking's reason contains a ScheduleId 
        // belonging to a class on THIS day.
        
        var schedulesToday = await _unitOfWork.TeachingSchedules.GetAll()
            .Where(ts => ts.Date == startOfDay)
            .Select(ts => ts.Id.ToString())
            .ToListAsync();

        if (schedulesToday.Any())
        {
            var outgoingRequests = await _unitOfWork.Bookings.GetAll()
                .Include(b => b.Room)
                .Include(b => b.RequestedByAccount)
                .Where(b => b.Status == BookingStatus.Pending && !string.IsNullOrEmpty(b.Reason))
                .ToListAsync();

            var relevantOutgoing = outgoingRequests
                .Where(b => schedulesToday.Any(sid => b.Reason!.Contains(sid)))
                .Where(b => !bookings.Any(existing => existing.Id == b.Id)) // Avoid duplicates
                .ToList();

            bookings.AddRange(relevantOutgoing);
        }

        return _mapper.Map<List<BookingResponseDto>>(bookings.OrderBy(b => b.TimeSlot).ToList());
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

        return await CreateBookingAsync(bookingDto, userId, skipDurationCheck: true);
    }

    public async Task<BookingResponseDto> CreateScheduleChangeRequestAsync(CreateScheduleChangeRequestDto dto, Guid userId)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
        if (account == null || account.Role != AccountRole.Lecturer)
        {
            throw new UnauthorizedAccessException("Only Lecturers can request schedule changes.");
        }

        var schedule = await _unitOfWork.TeachingSchedules.GetByIdAsync(dto.ScheduleId);
        if (schedule == null)
            throw new InvalidOperationException("Original schedule not found.");

        var newTimes = SlotHelper.GetSlotTimes(dto.SlotType, dto.NewSlot);
        var newStart = dto.NewDate.Date + newTimes.StartTime;
        var durationHrs = (int)Math.Round((newTimes.EndTime - newTimes.StartTime).TotalHours);

        var bookingDto = new CreateBookingDto
        {
            RoomId = dto.NewRoomId,
            TimeSlot = newStart,
            Duration = durationHrs,
            Reason = dto.Reason.StartsWith("[Schedule Change Request]") ? dto.Reason : $"[Schedule Change Request] ScheduleId: {dto.ScheduleId}. Reason: {dto.Reason}"
        };

        // Create the booking request using existing overlapping logic
        return await CreateBookingAsync(bookingDto, userId, skipDurationCheck: true);
    }

    public async Task<bool> CancelBookingAsync(Guid bookingId, Guid userId)
    {
        var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
        if (booking == null) return false;

        // Ensure user owns the booking
        if (booking.RequestedBy != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền huỷ yêu cầu của người khác.");
        }

        // Rule 1: Pending bookings can always be cancelled
        if (booking.Status == BookingStatus.Pending)
        {
            booking.Status = BookingStatus.Cancelled;
            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        // Rule 2: Approved bookings can only be cancelled if in the future AND NOT a change request
        if (booking.Status == BookingStatus.Approved)
        {
            if (booking.TimeSlot <= DateTime.Now)
            {
                throw new InvalidOperationException("Không thể huỷ yêu cầu đã diễn ra trong quá khứ hoặc hiện tại.");
            }

            var reason = booking.Reason ?? "";
            var isChangeRequest = reason.StartsWith("[Room Change Request]") || reason.StartsWith("[Schedule Change Request]");
            
            if (isChangeRequest)
            {
                throw new InvalidOperationException("Không thể tự động huỷ yêu cầu đổi lịch/đổi phòng đã được duyệt. Vui lòng tạo yêu cầu mới hoặc liên hệ quản trị viên.");
            }

            booking.Status = BookingStatus.Cancelled;
            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        // If already cancelled or rejected, no action needed but we can say it's done or return false
        if (booking.Status == BookingStatus.Cancelled) return true;

        throw new InvalidOperationException($"Không thể huỷ yêu cầu ở trạng thái: {booking.Status}");
    }
}
