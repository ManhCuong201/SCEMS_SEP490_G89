using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Equipment;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Api.Requests;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;

    public EquipmentController(IEquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEquipment([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null)
    {
        var @params = new PaginationParams { PageIndex = pageIndex, PageSize = pageSize, Search = search, SortBy = sortBy };
        var result = await _equipmentService.GetEquipmentAsync(@params);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEquipmentById(Guid id)
    {
        var equipment = await _equipmentService.GetEquipmentByIdAsync(id);
        if (equipment == null)
            return NotFound(new { message = "Equipment not found" });
        return Ok(equipment);
    }

    [HttpPost]
    public async Task<IActionResult> CreateEquipment([FromBody] CreateEquipmentDto dto)
    {
        try
        {
            var equipment = await _equipmentService.CreateEquipmentAsync(dto);
            return CreatedAtAction(nameof(GetEquipmentById), new { id = equipment.Id }, equipment);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEquipment(Guid id, [FromBody] UpdateEquipmentDto dto)
    {
        try
        {
            var equipment = await _equipmentService.UpdateEquipmentAsync(id, dto);
            if (equipment == null)
                return NotFound(new { message = "Equipment not found" });
            return Ok(equipment);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEquipment(Guid id)
    {
        var result = await _equipmentService.DeleteEquipmentAsync(id);
        if (!result)
            return NotFound(new { message = "Equipment not found" });
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var result = await _equipmentService.UpdateStatusAsync(id, request.Status);
        if (!result)
            return NotFound(new { message = "Equipment not found" });
        return Ok(new { message = "Status updated successfully" });
    }
    [HttpPost("import")]
    public async Task<IActionResult> Import(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        using var stream = file.OpenReadStream();
        try
        {
            var count = await _equipmentService.ImportEquipmentAsync(stream);
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Failed to import file: " + ex.Message });
        }
    }
}
