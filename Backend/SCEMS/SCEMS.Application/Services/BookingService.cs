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
            .AsNoTracking()
            .Include(b => b.Room)
            .Include(b => b.RequestedByAccount)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(b => b.RequestedBy == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLower();
            query = query.Where(b => b.Room != null && b.Room.RoomName.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(@params.Status) && Enum.TryParse<BookingStatus>(@params.Status, true, out var status))
        {
            query = query.Where(b => b.Status == status);
        }

        if (@params.Date.HasValue)
        {
            var startDate = @params.Date.Value.Date;
            var endDate = startDate.AddDays(1);
            query = query.Where(b => b.TimeSlot >= startDate && b.TimeSlot < endDate);
        }

        query = query.OrderByDescending(b => b.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .ToListAsync();

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
            .AsNoTracking()
            .Include(b => b.Room)
            .Include(b => b.RequestedByAccount)
            .FirstOrDefaultAsync(b => b.Id == id);

        return booking != null ? _mapper.Map<BookingResponseDto>(booking) : null;
    }

    public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, Guid userId, bool skipDurationCheck = false, Guid? excludeScheduleId = null)
    {
        // 1. Validation: Constraints
        var errors = new List<string>();

        try
        {
            await _unitOfWork.BeginTransactionAsync();

            // 1. Validation: Time is in future (inside transaction to be safe)
            var now = DateTime.Now;
            var endTime = dto.TimeSlot.AddHours(dto.Duration);

            if (endTime < now)
            {
                errors.Add("Không thể mượn hoặc đổi phòng vào thời gian đã qua.");
            }
            else if (dto.TimeSlot < now.AddMinutes(-5))
            {
                errors.Add("Thời gian bắt đầu mượn phòng không thể ở quá khứ.");
            }

            // Duration check
            if (!skipDurationCheck && dto.Duration <= 0)
            {
                 errors.Add("Thời lượng mượn phòng không hợp lệ.");
            }
            else if (!skipDurationCheck && dto.Duration < 0.5)
            {
                errors.Add("Thời lượng mượn phòng tối thiểu là 30 phút.");
            }

            if (errors.Any())
            {
                throw new InvalidOperationException(string.Join("|", errors));
            }

            // Re-fetch dynamic settings inside transaction
            var maxPerWeek = await _configurationService.GetValueAsync("Booking.MaxPerWeek", 5);

            // Frequency Limit Check
            var startOfWeek = dto.TimeSlot.Date.AddDays(-(int)dto.TimeSlot.DayOfWeek + (int)DayOfWeek.Monday);
            var endOfWeek = startOfWeek.AddDays(7);
            
            var weeklyBookingCount = await _unitOfWork.Bookings.GetAll()
                .CountAsync(b => b.RequestedBy == userId 
                    && b.TimeSlot >= startOfWeek 
                    && b.TimeSlot < endOfWeek 
                    && b.Status != BookingStatus.Rejected 
                    && b.Status != BookingStatus.Cancelled);
                
            if (weeklyBookingCount >= maxPerWeek)
            {
                errors.Add($"Bạn đã đạt tới giới hạn mượn phòng tối đa ({maxPerWeek} lần) trong tuần của ngày đặt ({startOfWeek:dd/MM} - {endOfWeek.AddDays(-1):dd/MM}).");
            }

            // 2. Validation: Room exists
            var room = await _unitOfWork.Rooms.GetAll()
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == dto.RoomId);

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
                var candidateBookings = await _unitOfWork.Bookings.GetAll()
                    .Where(b => b.RoomId == dto.RoomId 
                        && b.TimeSlot.Date == date 
                        && b.Status != BookingStatus.Rejected 
                        && b.Status != BookingStatus.Cancelled)
                    .ToListAsync();

                var conflictingBooking = candidateBookings.Any(b => 
                {
                    var overlaps = b.TimeSlot < newEnd && b.TimeSlot.AddHours(b.Duration) > newStart;
                    if (!overlaps) return false;
                    if (excludeScheduleId != null && !string.IsNullOrEmpty(b.Reason))
                    {
                        if (b.Reason.Contains(excludeScheduleId.ToString()!)) return false;
                    }
                    return true;
                });

                if (conflictingBooking)
                {
                    errors.Add("Phòng này đã được người khác mượn trong thời gian này.");
                }
                    
                var hasClass = await _unitOfWork.TeachingSchedules.GetAll()
                     .AnyAsync(ts => ts.RoomId == dto.RoomId 
                        && ts.Date == date 
                        && ts.Id != excludeScheduleId
                        && ts.StartTime < reqEndTime 
                        && ts.EndTime > reqStartTime);

                if (hasClass)
                {
                    errors.Add("Phòng này đã được xếp lịch dạy lớp khác vào thời gian này.");
                }
            }

            // 4. Check Lecturer/User Conflict
            var userHasClass = await _unitOfWork.TeachingSchedules.GetAll()
                .AnyAsync(ts => ts.LecturerId == userId.ToString() 
                    && ts.Date == date 
                    && ts.Id != excludeScheduleId
                    && ts.StartTime < reqEndTime 
                    && ts.EndTime > reqStartTime);

            if (userHasClass)
            {
                errors.Add("Bạn đã có lịch dạy lớp khác vào thời gian này.");
            }

            var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
            if (account?.Role == AccountRole.Student)
            {
                var enrolledClassCodes = await _unitOfWork.ClassStudents.GetAll()
                    .Where(cs => cs.StudentId == userId)
                    .Select(cs => cs.Class != null ? cs.Class.ClassCode : cs.PendingStudentIdentifier)
                    .Where(cc => cc != null)
                    .ToListAsync();

                if (enrolledClassCodes.Any())
                {
                    var studentHasClass = (await _unitOfWork.TeachingSchedules.GetAll()
                        .Where(ts => enrolledClassCodes.Contains(ts.ClassCode) && ts.Date == date)
                        .ToListAsync())
                        .Any(ts => ts.StartTime < reqEndTime && ts.EndTime > reqStartTime);

                    if (studentHasClass)
                    {
                        errors.Add("Bạn đã có lịch học lớp khác vào thời gian này.");
                    }
                }
            }

            var userHasBooking = (await _unitOfWork.Bookings.GetAll()
                .Where(b => b.RequestedBy == userId && b.Status != BookingStatus.Rejected && b.Status != BookingStatus.Cancelled)
                .ToListAsync())
                .Any(b => {
                    var overlaps = b.TimeSlot < newEnd && b.TimeSlot.AddHours(b.Duration) > newStart;
                    if (!overlaps) return false;
                    if (excludeScheduleId != null && !string.IsNullOrEmpty(b.Reason))
                    {
                        if (b.Reason.Contains(excludeScheduleId.ToString()!)) return false;
                    }
                    return true;
                });

            if (userHasBooking)
            {
                errors.Add("Bạn đã có một yêu cầu mượn phòng khác trong thời gian này.");
            }

            if (errors.Any())
            {
                throw new InvalidOperationException(string.Join("|", errors));
            }

            // Check Auto-Approve conditions
            var autoApproveEnabled = await _configurationService.GetValueAsync("Booking.AutoApproveEnabled", "false") == "true";
            var status = BookingStatus.Pending;

            if (autoApproveEnabled && account != null && room?.RoomType != null)
            {
                var rulesJson = await _configurationService.GetValueAsync("Booking.AutoApproveRules", "[]");
                try
                {
                    var rules = System.Text.Json.JsonSerializer.Deserialize<List<AutoApproveRule>>(rulesJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    if (rules != null)
                    {
                        var userRole = account.Role.ToString();
                        var roomTypeName = room.RoomType.Name;

                        foreach (var rule in rules)
                        {
                            bool roleMatch = rule.Role == "*" || string.Equals(rule.Role, userRole, StringComparison.OrdinalIgnoreCase);
                            
                            // Support multiple room types in one rule (comma separated)
                            var allowedRoomTypes = rule.RoomType.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                            bool roomMatch = rule.RoomType == "*" || allowedRoomTypes.Contains(roomTypeName, StringComparer.OrdinalIgnoreCase);

                            if (roleMatch && roomMatch)
                            {
                                status = BookingStatus.Approved;
                                break;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Error parsing auto-approve rules: {ex.Message}");
                }
            }

            var booking = new Booking
            {
                RoomId = dto.RoomId,
                RequestedBy = userId,
                TimeSlot = dto.TimeSlot,
                Duration = dto.Duration,
                Reason = dto.Reason,
                Status = status,
                CreatedAt = DateTime.Now
            };

            await _unitOfWork.Bookings.AddAsync(booking);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            if (status == BookingStatus.Approved)
            {
                await _notificationService.SendNotificationAsync(userId, "Yêu cầu mượn phòng được phê duyệt tự động", 
                    $"Yêu cầu mượn phòng {room?.RoomName} vào {dto.TimeSlot:dd/MM HH:mm} đã được hệ thống phê duyệt tự động.");
            }

            return await GetBookingByIdAsync(booking.Id) ?? throw new InvalidOperationException("Failed to retrieve created booking");
        }
        catch (Exception)
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    private class AutoApproveRule
    {
        public string Role { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
    }

    public async Task<BookingResponseDto?> UpdateStatusAsync(Guid id, BookingStatus status, string? rejectReason = null)
    {
        try
        {
            await _unitOfWork.BeginTransactionAsync();

            var booking = await _unitOfWork.Bookings.GetAll()
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null) 
            {
                await _unitOfWork.RollbackTransactionAsync();
                return null;
            }

            booking.Status = status;
            if (status == BookingStatus.Rejected && !string.IsNullOrEmpty(rejectReason))
            {
                booking.RejectReason = rejectReason;
            }
            
            // If approved, first verify no already-Approved booking conflicts exist
            if (status == BookingStatus.Approved || status == BookingStatus.CheckedIn)
            {
                 var start = booking.TimeSlot;
                 var end = booking.TimeSlot.AddHours(booking.Duration);

                 // Guard: reject if an already-approved booking overlaps this one
                 var approvedCandidates = await _unitOfWork.Bookings.GetAll()
                    .Where(b => b.RoomId == booking.RoomId
                        && b.Id != booking.Id
                        && (b.Status == BookingStatus.Approved || b.Status == BookingStatus.CheckedIn || b.Status == BookingStatus.Completed)
                        && b.TimeSlot < end)
                    .ToListAsync();

                 var alreadyApprovedConflict = approvedCandidates.Any(b => b.TimeSlot.AddHours(b.Duration) > start);

                 if (alreadyApprovedConflict)
                 {
                     throw new InvalidOperationException("Không thể phê duyệt: phòng này đã được duyệt cho một yêu cầu khác trong cùng thời gian.");
                 }

                 // Auto-reject all other Pending requests that overlap
                 var pendingCandidates = await _unitOfWork.Bookings.GetAll()
                    .Where(b => b.RoomId == booking.RoomId && b.Id != booking.Id && b.Status == BookingStatus.Pending && b.TimeSlot < end)
                    .ToListAsync();

                 var conflicting = pendingCandidates
                    .Where(b => b.TimeSlot.AddHours(b.Duration) > start)
                    .ToList();
                
                 foreach(var conflict in conflicting)
                 {
                     conflict.Status = BookingStatus.Rejected;
                     conflict.RejectReason = "Hệ thống tự động từ chối do trùng lịch với một yêu cầu đã được phê duyệt.";
                     _unitOfWork.Bookings.Update(conflict);
                 }

                 // Handle Change Requests
                 if (!string.IsNullOrEmpty(booking.Reason) && 
                    (booking.Reason.StartsWith("[Schedule Change Request]") || booking.Reason.StartsWith("[Room Change Request]")))
                 {
                     // Format: "[Schedule Change Request] ScheduleId: {id}. Original: {room} on {date} Slot {slot}. New: {newRoom} on {newDate} Slot {newSlot}. Reason: {reason}"
                     var scheduleIdMatch = System.Text.RegularExpressions.Regex.Match(booking.Reason, @"ScheduleId:\s*([a-fA-F0-9-]+)");
                     if (scheduleIdMatch.Success && Guid.TryParse(scheduleIdMatch.Groups[1].Value, out var scheduleId))
                     {
                         var schedule = await _unitOfWork.TeachingSchedules.GetByIdAsync(scheduleId);
                         if (schedule != null)
                         {
                             // Update Room
                             schedule.RoomId = booking.RoomId;

                             // Update Time if it's a Schedule Change
                             if (booking.Reason.StartsWith("[Schedule Change Request]"))
                             {
                                 schedule.Date = booking.TimeSlot.Date;
                                 
                                 // Try to parse SlotType and NewSlot from the reason string
                                 var matchSlot = System.Text.RegularExpressions.Regex.Match(booking.Reason, @"NewSlot:\s*(\d+)");
                                 var matchType = System.Text.RegularExpressions.Regex.Match(booking.Reason, @"SlotType:\s*(New|Old)");
                                 
                                 if (matchSlot.Success && matchType.Success)
                                 {
                                     var newSlotVal = int.Parse(matchSlot.Groups[1].Value);
                                     var slotTypeStr = matchType.Groups[1].Value;
                                     
                                     schedule.Slot = newSlotVal;
                                     var times = SlotHelper.GetSlotTimes(slotTypeStr, newSlotVal);
                                     schedule.StartTime = times.StartTime;
                                     schedule.EndTime = times.EndTime;
                                 }
                                 else
                                 {
                                     // Fallback for legacy requests without SlotType in Reason
                                     var hour = booking.TimeSlot.Hour;
                                     int fallBackSlot = hour switch
                                     {
                                         7 => 1,
                                         10 => 2,
                                         12 => 3,
                                         15 => 4,
                                         18 => 5,
                                         20 => 6,
                                         _ => 1
                                     };
                                     schedule.Slot = fallBackSlot;
                                     schedule.StartTime = booking.TimeSlot.TimeOfDay;
                                     schedule.EndTime = booking.TimeSlot.AddHours(booking.Duration).TimeOfDay;
                                 }
                             }

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
                                     "Thay đổi lịch học (Phê duyệt)", 
                                     $"Lịch học môn {schedule.Subject} đã được thay đổi sang phòng {booking.Room?.RoomName} vào lúc {booking.TimeSlot:HH:mm dd/MM/yyyy}.",
                                         "/schedule");
                                 }
                             }
                         }
                     }
                 }
        }
        _unitOfWork.Bookings.Update(booking);
        await _unitOfWork.SaveChangesAsync();
        await _unitOfWork.CommitTransactionAsync();

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

        var notificationMessage = $"{requestTypeStr} cho phòng {booking.Room?.RoomName} vào {booking.TimeSlot:dd/MM/yyyy} đã {statusStr}.";
        if (status == BookingStatus.Rejected && !string.IsNullOrEmpty(booking.RejectReason))
        {
            notificationMessage += $" Lý do: {booking.RejectReason}";
        }

        await _notificationService.SendNotificationAsync(booking.RequestedBy, 
            $"Kết quả: {requestTypeStr}", 
            notificationMessage,
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
        catch (Exception)
        {
            await _unitOfWork.RollbackTransactionAsync();
            throw;
        }
    }

    public async Task<List<BookingResponseDto>> GetRoomScheduleAsync(Guid roomId, DateTime startDate, DateTime endDate)
    {
        var bookings = await _unitOfWork.Bookings.GetAll()
            .AsNoTracking()
            .Where(b => b.RoomId == roomId 
                && b.TimeSlot >= startDate 
                && b.TimeSlot <= endDate 
                && b.Status != BookingStatus.Rejected 
                && b.Status != BookingStatus.Cancelled)
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

        // 1. Get direct bookings for this day
        var query = _unitOfWork.Bookings.GetAll()
            .AsNoTracking()
            .Include(b => b.Room)
            .Include(b => b.RequestedByAccount)
            .Where(b => b.TimeSlot >= startOfDay && b.TimeSlot < endOfDay 
                && b.Status != BookingStatus.Rejected 
                && b.Status != BookingStatus.Cancelled);

        var bookingsOnDay = await query.ToListAsync();

        // 2. Get today's schedules to check for outgoing change requests
        var todayScheduleIds = await _unitOfWork.TeachingSchedules.GetAll()
            .AsNoTracking()
            .Where(ts => ts.Date == startOfDay)
            .Select(ts => ts.Id.ToString())
            .ToListAsync();

        if (todayScheduleIds.Any())
        {
            // Optimization: Filter for pending change requests that reference today's schedules
            // instead of loading all pending bookings across the entire system.
            var relevantOutgoing = new List<Booking>();
            
            // We can't easily do a deep 'Contains' check for every ID in a single query with SQL reasonably 
            // without complex raw SQL, but we can at least filter for [Room Change] or [Schedule Change] first.
            var pendingRequests = await _unitOfWork.Bookings.GetAll()
                .AsNoTracking()
                .Include(b => b.Room)
                .Include(b => b.RequestedByAccount)
                .Where(b => b.Status == BookingStatus.Pending 
                    && b.Reason != null 
                    && (b.Reason.Contains("[Room Change Request]") || b.Reason.Contains("[Schedule Change Request]"))
                    && (b.TimeSlot < startOfDay || b.TimeSlot >= endOfDay))
                .ToListAsync();

            foreach (var req in pendingRequests)
            {
                if (todayScheduleIds.Any(sid => req.Reason!.Contains(sid)))
                {
                    relevantOutgoing.Add(req);
                }
            }

            bookingsOnDay.AddRange(relevantOutgoing);
        }

        return _mapper.Map<List<BookingResponseDto>>(bookingsOnDay.OrderBy(b => b.TimeSlot).ToList());
    }


    public async Task<BookingResponseDto> CreateRoomChangeRequestAsync(CreateRoomChangeRequestDto dto, Guid userId)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
        if (account == null || account.Role != AccountRole.Lecturer)
        {
            throw new UnauthorizedAccessException("Only Lecturers can request room changes.");
        }

        var schedule = await _unitOfWork.TeachingSchedules.GetByIdAsync(dto.ScheduleId);
        if (schedule == null)
            throw new InvalidOperationException("Không tìm thấy lịch dạy gốc.");

        // 1. Validation: No Change
        if (schedule.RoomId == dto.NewRoomId && schedule.Date == dto.TimeSlot.Date && schedule.StartTime == dto.TimeSlot.TimeOfDay)
        {
            throw new InvalidOperationException("Yêu cầu này trùng khớp hoàn toàn với lịch hiện tại. Vui lòng chọn phòng hoặc thời gian khác.");
        }

        // 2. Validation: Duplicate Pending Request
        var hasPending = await _unitOfWork.Bookings.GetAll()
            .AnyAsync(b => b.Status == BookingStatus.Pending 
                && b.Reason != null 
                && b.Reason.Contains($"ScheduleId: {dto.ScheduleId}"));
        
        if (hasPending)
        {
            throw new InvalidOperationException("Lịch dạy này đã có một yêu cầu đang chờ duyệt. Vui lòng chờ kết quả hoặc huỷ yêu cầu cũ trước khi tạo yêu cầu mới.");
        }

        var bookingDto = new CreateBookingDto
        {
            RoomId = dto.NewRoomId,
            TimeSlot = dto.TimeSlot,
            Duration = dto.Duration,
        };
        bookingDto.Reason = $"[Room Change Request] ScheduleId: {dto.ScheduleId}. From {dto.OriginalRoomId} to {dto.NewRoomId}. Reason: {dto.Reason}";

        return await CreateBookingAsync(bookingDto, userId, skipDurationCheck: true, excludeScheduleId: dto.ScheduleId);
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
            throw new InvalidOperationException("Không tìm thấy lịch dạy gốc.");

        var newTimes = SlotHelper.GetSlotTimes(dto.SlotType, dto.NewSlot);
        var newStart = dto.NewDate.Date + newTimes.StartTime;
        var durationHrs = (int)Math.Round((newTimes.EndTime - newTimes.StartTime).TotalHours);

        // 1. Validation: No Change
        if (schedule.RoomId == dto.NewRoomId && schedule.Date == dto.NewDate.Date && schedule.StartTime == newTimes.StartTime)
        {
            throw new InvalidOperationException("Yêu cầu này trùng khớp hoàn toàn với lịch hiện tại. Vui lòng chọn phòng hoặc thời gian khác.");
        }

        // 2. Validation: Duplicate Pending Request
        var hasPending = await _unitOfWork.Bookings.GetAll()
            .AnyAsync(b => b.Status == BookingStatus.Pending 
                && b.Reason != null 
                && b.Reason.Contains($"ScheduleId: {dto.ScheduleId}"));
        
        if (hasPending)
        {
            throw new InvalidOperationException("Lịch dạy này đã có một yêu cầu đang chờ duyệt. Vui lòng chờ kết quả hoặc huỷ yêu cầu cũ trước khi tạo yêu cầu mới.");
        }

        var bookingDto = new CreateBookingDto
        {
            RoomId = dto.NewRoomId,
            TimeSlot = newStart,
            Duration = durationHrs,
            Reason = $"[Schedule Change Request] ScheduleId: {dto.ScheduleId}. NewSlot: {dto.NewSlot}. SlotType: {dto.SlotType}. Reason: {dto.Reason}"
        };

        // Create the booking request using existing overlapping logic
        return await CreateBookingAsync(bookingDto, userId, skipDurationCheck: true, excludeScheduleId: dto.ScheduleId);
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
