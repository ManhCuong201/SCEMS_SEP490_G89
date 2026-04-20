using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.DTOs.RoomCheck;
using SCEMS.Application.Services.Interfaces;
using System.Security.Claims;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Guard,Admin,AssetStaff")]
public class RoomChecksController : ControllerBase
{
    private readonly IRoomCheckService _roomCheckService;

    public RoomChecksController(IRoomCheckService roomCheckService)
    {
        _roomCheckService = roomCheckService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingChecks()
    {
        var result = await _roomCheckService.GetPendingChecksAsync();
        return Ok(result);
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteCheck([FromBody] CompleteRoomCheckDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _roomCheckService.CompleteCheckAsync(dto, userId);
        return Ok(result);
    }
}
