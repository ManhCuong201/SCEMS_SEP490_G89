using Microsoft.EntityFrameworkCore;
using SCEMS.Application.DTOs.IssueReport;
using SCEMS.Application.DTOs.RoomCheck;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class RoomCheckService : IRoomCheckService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IIssueReportService _issueReportService;

    public RoomCheckService(IUnitOfWork unitOfWork, IIssueReportService issueReportService)
    {
        _unitOfWork = unitOfWork;
        _issueReportService = issueReportService;
    }

    public async Task<List<PendingRoomCheckDto>> GetPendingChecksAsync()
    {
        var today = DateTime.Today;
        var now = DateTime.Now;

        // 1. Get all bookings for today that are Approved or Completed
        var todayBookings = await _unitOfWork.Bookings.GetAll()
            .Include(b => b.Room)
            .Where(b => b.TimeSlot >= today && b.TimeSlot < today.AddDays(1) &&
                        (b.Status == BookingStatus.Approved || b.Status == BookingStatus.Completed))
            .ToListAsync();

        // 2. Get all teaching schedules for today
        var todaySchedules = await _unitOfWork.TeachingSchedules.GetAll()
            .Include(ts => ts.Room)
            .Where(ts => ts.Date == today)
            .ToListAsync();

        // Group activity by room to find the latest end time
        var roomActivities = new Dictionary<Guid, (string RoomName, string RoomCode, DateTime LastEndTime)>();

        foreach (var b in todayBookings)
        {
            if (b.Room == null) continue;
            var endTime = b.TimeSlot.AddHours(b.Duration);
            if (!roomActivities.ContainsKey(b.RoomId) || roomActivities[b.RoomId].LastEndTime < endTime)
            {
                roomActivities[b.RoomId] = (b.Room.RoomName, b.Room.RoomCode, endTime);
            }
        }

        foreach (var s in todaySchedules)
        {
            if (s.Room == null) continue;
            var endTime = s.Date.Add(s.EndTime);
            if (!roomActivities.ContainsKey(s.RoomId) || roomActivities[s.RoomId].LastEndTime < endTime)
            {
                roomActivities[s.RoomId] = (s.Room.RoomName, s.Room.RoomCode, endTime);
            }
        }

        // 3. Find rooms where the latest end time has passed
        var pendingRoomsList = roomActivities
            .Where(x => x.Value.LastEndTime <= now) // Activity finished
            .ToList();

        // 4. Filter out rooms that already have a security check (Issue Report by Guard today)
        var guardRole = AccountRole.Guard;
        var checkedRoomIdsToday = await _unitOfWork.IssueReports.GetAll()
            .Include(ir => ir.CreatedByAccount)
            .Where(ir => ir.CreatedAt >= today && ir.CreatedAt < today.AddDays(1) && 
                         ir.CreatedByAccount != null && ir.CreatedByAccount.Role == guardRole &&
                         ir.RoomId != null)
            .Select(ir => ir.RoomId!.Value)
            .Distinct()
            .ToListAsync();

        var pendingChecks = new List<PendingRoomCheckDto>();
        foreach (var kvp in pendingRoomsList)
        {
            if (!checkedRoomIdsToday.Contains(kvp.Key))
            {
                pendingChecks.Add(new PendingRoomCheckDto
                {
                    RoomId = kvp.Key,
                    RoomName = kvp.Value.RoomName,
                    RoomCode = kvp.Value.RoomCode,
                    LastActivityEndTime = kvp.Value.LastEndTime
                });
            }
        }

        return pendingChecks.OrderBy(p => p.LastActivityEndTime).ToList();
    }

    public async Task<IssueReportResponseDto> CompleteCheckAsync(CompleteRoomCheckDto dto, Guid guardId)
    {
        var description = "[SECURITY CHECK OK]";
        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            description += $" {dto.Note}";
        }

        var createDto = new CreateIssueReportDto
        {
            RoomId = dto.RoomId,
            Description = description
        };

        var report = await _issueReportService.CreateReportAsync(createDto, guardId);

        // Instantly close it because it's just a check marker, unless there's an actual issue.
        // If there's an actual issue, the Guard should use the normal Issue Reporting flow instead.
        await _issueReportService.UpdateStatusAsync(report.Id, IssueReportStatus.Closed);
        
        // Fetch again to get updated status
        return await _issueReportService.GetReportByIdAsync(report.Id) ?? report;
    }
}
