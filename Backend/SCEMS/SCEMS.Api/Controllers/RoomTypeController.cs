using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.DTOs.RoomType;
using SCEMS.Application.Services.Interfaces;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/room-types")]
[Authorize] // Assuming admin only, but check granular permissions if needed
public class RoomTypeController : ControllerBase
{
    private readonly IRoomTypeService _roomTypeService;

    public RoomTypeController(IRoomTypeService roomTypeService)
    {
        _roomTypeService = roomTypeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var types = await _roomTypeService.GetAllAsync();
        return Ok(types);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var type = await _roomTypeService.GetByIdAsync(id);
        if (type == null) return NotFound();
        return Ok(type);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateRoomTypeDto dto)
    {
        var result = await _roomTypeService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoomTypeDto dto)
    {
        try
        {
            var result = await _roomTypeService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _roomTypeService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
