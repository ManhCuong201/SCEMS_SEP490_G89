using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.DTOs.Schedule;
using SCEMS.Application.Services.Interfaces;
using System.Security.Claims;

namespace SCEMS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/teaching-schedules")]
public class TeachingSchedulesController : ControllerBase
{
    private readonly ITeachingScheduleService _teachingScheduleService;

    public TeachingSchedulesController(ITeachingScheduleService teachingScheduleService)
    {
        _teachingScheduleService = teachingScheduleService;
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<ScheduleResponseDto>>> GetMySchedule([FromQuery] DateTime start, [FromQuery] DateTime end, [FromQuery] string? classCode)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var schedule = await _teachingScheduleService.GetMyScheduleAsync(userId, start, end, classCode);
        return Ok(schedule);
    }

    [HttpGet("day")]
    public async Task<ActionResult<List<ScheduleResponseDto>>> GetSchedulesByDay([FromQuery] DateTime date)
    {
        var schedules = await _teachingScheduleService.GetSchedulesByDateAsync(date);
        return Ok(schedules);
    }

    [Authorize(Roles = "Lecturer,Admin")]
    [HttpGet("template")]
    public async Task<IActionResult> DownloadTemplate()
    {
        var content = await _teachingScheduleService.GetImportTemplateAsync();
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "TeachingSchedule_Template.xlsx");
    }

    [Authorize(Roles = "Lecturer,Admin")]
    [HttpPost("import")]
    public async Task<IActionResult> ImportSchedule(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Please upload an Excel file.");

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _teachingScheduleService.ImportScheduleAsync(stream, userId);
            return Ok(new { message = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
