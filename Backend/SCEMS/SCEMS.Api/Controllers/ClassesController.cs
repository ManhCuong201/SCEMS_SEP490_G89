using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Services.Interfaces;
using System.Security.Claims;
using System;
using System.Threading.Tasks;

namespace SCEMS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    [HttpGet("teacher")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> GetTeacherClasses()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId)) 
            return Unauthorized();
 
        var classes = await _classService.GetClassesByLecturerAsync(userId);
        return Ok(classes);
    }

    [HttpGet("{id}/students")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> GetClassStudents(Guid id)
    {
        var students = await _classService.GetClassStudentsAsync(id);
        return Ok(students);
    }

    [HttpGet("download-template")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> DownloadTemplate()
    {
        var stream = await _classService.GetStudentImportTemplateAsync();
        return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Student_Import_Template.xlsx");
    }

    [HttpPost("{id}/import-students")]
    [Authorize(Roles = "Lecturer")]
    public async Task<IActionResult> ImportStudents(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("Please upload a valid Excel file.");

        var result = await _classService.ImportStudentsFromExcelAsync(id, file.OpenReadStream());
        return Ok(new { message = "Students imported successfully" });
    }
}
