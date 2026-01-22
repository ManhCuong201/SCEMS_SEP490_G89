using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Room;
using SCEMS.Application.Services.Interfaces;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null)
    {
        var @params = new PaginationParams { PageIndex = pageIndex, PageSize = pageSize, Search = search, SortBy = sortBy };
        var result = await _roomService.GetRoomsAsync(@params);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoomById(Guid id)
    {
        var room = await _roomService.GetRoomByIdAsync(id);
        if (room == null)
            return NotFound(new { message = "Room not found" });
        return Ok(room);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto dto)
    {
        try
        {
            var room = await _roomService.CreateRoomAsync(dto);
            return CreatedAtAction(nameof(GetRoomById), new { id = room.Id }, room);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoom(Guid id, [FromBody] UpdateRoomDto dto)
    {
        try
        {
            var room = await _roomService.UpdateRoomAsync(id, dto);
            if (room == null)
                return NotFound(new { message = "Room not found" });
            return Ok(room);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoom(Guid id)
    {
        var result = await _roomService.DeleteRoomAsync(id);
        if (!result)
            return NotFound(new { message = "Room not found" });
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var result = await _roomService.UpdateStatusAsync(id, request.Status);
        if (!result)
            return NotFound(new { message = "Room not found" });
        return Ok(new { message = "Status updated successfully" });
    }
}

public class UpdateStatusRequest
{
    public int Status { get; set; }
}
