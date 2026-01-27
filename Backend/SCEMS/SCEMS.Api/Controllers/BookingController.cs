using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Booking;
using SCEMS.Application.Services.Interfaces;
using System.Security.Claims;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetBookings([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var userId = GetCurrentUserId();
        // If Admin, show all. If Staff/User, show theirs? 
        // Requirement implies Admin/Staff manages bookings, but Users (Teachers) book them.
        // Usually Admin/Manager sees all. Teacher sees theirs or all availability?
        // Let's assume Admin sees all, User sees theirs for history, OR everyone sees public schedule?
        // For "My Bookings", we filter by UserID. For "Room Schedule", we filter by Room.
        // Simplified: Admin sees all. Non-admin sees theirs.
        
        Guid? filterUserId = null;
        if (!User.IsInRole("Admin") && !User.IsInRole("RoomBookingStaff"))
        {
            filterUserId = userId;
        }

        var @params = new PaginationParams { PageIndex = pageIndex, PageSize = pageSize, Search = search };
        var result = await _bookingService.GetBookingsAsync(@params, filterUserId);
        return Ok(result);
    }
    
    // Separate endpoint for Room Availability/Schedule?
    // Let's add GetRoomSchedule?
    // Or just use search logic in GetBookings.
    // For now, MVP.

    [HttpGet("room/{roomId}/schedule")]
    public async Task<IActionResult> GetRoomSchedule(Guid roomId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var result = await _bookingService.GetRoomScheduleAsync(roomId, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBookingById(Guid id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null) return NotFound();
        
        // Authorization check: Admin or Owner
        var userId = GetCurrentUserId();
        if (!User.IsInRole("Admin") && !User.IsInRole("RoomBookingStaff") && booking.RequestedBy != userId)
        {
            return Forbid();
        }

        return Ok(booking);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var booking = await _bookingService.CreateBookingAsync(dto, userId);
            return CreatedAtAction(nameof(GetBookingById), new { id = booking.Id }, booking);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("change-room")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> CreateRoomChangeRequest([FromBody] CreateRoomChangeRequestDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var booking = await _bookingService.CreateRoomChangeRequestAsync(dto, userId);
            return CreatedAtAction(nameof(GetBookingById), new { id = booking.Id }, booking);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,RoomBookingStaff")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateBookingStatusDto dto)
    {
        var booking = await _bookingService.UpdateStatusAsync(id, dto.Status);
        if (booking == null) return NotFound();
        return Ok(booking);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier); // or "id" from JWT
        if (claim != null && Guid.TryParse(claim.Value, out var id))
            return id;
        throw new UnauthorizedAccessException("User ID not found in token");
    }
}
