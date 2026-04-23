using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,BookingStaff")]
public class StatisticsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public StatisticsController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet("room-usage")]
    public async Task<IActionResult> GetRoomUsage([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        // 1. Get approved bookings in range
        var bookings = await _unitOfWork.Bookings.GetAll()
            .Include(b => b.Room)
            .ThenInclude(r => r!.RoomType)
            .Where(b => b.Status == BookingStatus.Approved && b.TimeSlot >= startDate && b.TimeSlot <= endDate)
            .ToListAsync();

        // 2. Get teaching schedules in range
        var schedules = await _unitOfWork.TeachingSchedules.GetAll()
            .Include(s => s.Room)
            .ThenInclude(r => r!.RoomType)
            .Where(s => s.Date >= startDate && s.Date <= endDate)
            .ToListAsync();

        // Combine and group by RoomType
        var usageStats = new Dictionary<string, double>();

        foreach (var b in bookings)
        {
            var typeName = b.Room?.RoomType?.Name ?? "Khác";
            if (!usageStats.ContainsKey(typeName)) usageStats[typeName] = 0;
            usageStats[typeName] += b.Duration; // Assuming duration is in hours or consistent unit
        }

        foreach (var s in schedules)
        {
            var typeName = s.Room?.RoomType?.Name ?? "Khác";
            if (!usageStats.ContainsKey(typeName)) usageStats[typeName] = 0;
            // Slots are typically 1.5h or fixed duration. Let's assume 1.5h for SE1701 style slots if not specified.
            // If Slot is 1-12, maybe 1.5h per slot.
            usageStats[typeName] += 1.5; 
        }

        var result = usageStats.Select(kvp => new { name = kvp.Key, value = kvp.Value }).ToList();
        return Ok(result);
    }

    [HttpGet("booking-status")]
    public async Task<IActionResult> GetBookingStatusStats()
    {
        var stats = await _unitOfWork.Bookings.GetAll()
            .GroupBy(b => b.Status)
            .Select(g => new { name = g.Key.ToString(), value = g.Count() })
            .ToListAsync();

        // Translate names to Vietnamese
        var result = stats.Select(s => new {
            name = s.name switch {
                "Pending" => "Đang chờ",
                "Approved" => "Đã duyệt",
                "Rejected" => "Đã từ chối",
                "Cancelled" => "Đã hủy",
                _ => s.name
            },
            value = s.value
        });

        return Ok(result);
    }

    [HttpGet("top-rooms")]
    public async Task<IActionResult> GetTopUsedRooms([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var bookingUsage = await _unitOfWork.Bookings.GetAll()
            .Include(b => b.Room)
            .Where(b => b.Status == BookingStatus.Approved && b.TimeSlot >= startDate && b.TimeSlot <= endDate)
            .GroupBy(b => b.Room!.RoomName)
            .Select(g => new { name = g.Key, value = (double)g.Sum(b => b.Duration) })
            .ToListAsync();

        var scheduleUsage = await _unitOfWork.TeachingSchedules.GetAll()
            .Include(s => s.Room)
            .Where(s => s.Date >= startDate && s.Date <= endDate)
            .GroupBy(s => s.Room!.RoomName)
            .Select(g => new { name = g.Key, value = g.Count() * 1.5 })
            .ToListAsync();

        var combined = bookingUsage.Concat(scheduleUsage)
            .GroupBy(x => x.name)
            .Select(g => new { name = g.Key, value = g.Sum(x => x.value) })
            .OrderByDescending(x => x.value)
            .Take(5)
            .ToList();

        return Ok(combined);
    }

    [HttpGet("issue-reports")]
    public async Task<IActionResult> GetIssueReportStats()
    {
        // Group by category if exists, or status
        // Let's check IssueReport entity
        var stats = await _unitOfWork.IssueReports.GetAll()
            .GroupBy(i => i.Status)
            .Select(g => new { name = g.Key.ToString(), value = g.Count() })
            .ToListAsync();

        var result = stats.Select(s => new {
            name = s.name switch {
                "Open" => "Chưa xử lý",
                "InProgress" => "Đang xử lý",
                "Resolved" => "Đã giải quyết",
                "Closed" => "Đã đóng",
                _ => s.name
            },
            value = s.value
        });

        return Ok(result);
    }
}
