using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.IssueReport;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Enums;
using System.Security.Claims;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IssueReportsController : ControllerBase
{
    private readonly IIssueReportService _issueReportService;

    public IssueReportsController(IIssueReportService issueReportService)
    {
        _issueReportService = issueReportService;
    }

    [HttpGet]
    [Authorize(Roles = "Guard, AssetStaff, Lecturer, Student, Admin")]
    public async Task<IActionResult> GetReports([FromQuery] PaginationParams @params, [FromQuery] IssueReportStatus? status)
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        Guid? queryUserId = null;
        // Normal users only see their own reports. Staff sees all.
        if (userRole == "Lecturer" || userRole == "Student")
        {
            queryUserId = userId;
        }

        var result = await _issueReportService.GetReportsAsync(@params, queryUserId, status);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Guard, AssetStaff, Lecturer, Student, Admin")]
    public async Task<IActionResult> GetReport(Guid id)
    {
        var result = await _issueReportService.GetReportByIdAsync(id);
        if (result == null) return NotFound();

        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if ((userRole == "Lecturer" || userRole == "Student") && result.CreatedBy != userId)
        {
            return Forbid();
        }

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer, Student, Guard, Admin")]
    public async Task<IActionResult> CreateReport([FromBody] CreateIssueReportDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _issueReportService.CreateReportAsync(dto, userId);
        return CreatedAtAction(nameof(GetReport), new { id = result.Id }, result);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Guard, AssetStaff, Admin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateIssueReportStatusDto dto)
    {
        var result = await _issueReportService.UpdateStatusAsync(id, dto.Status);
        if (result == null) return NotFound();

        return Ok(result);
    }
}
