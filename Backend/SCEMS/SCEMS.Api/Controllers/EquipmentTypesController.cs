using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.EquipmentType;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Api.Requests;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/admin/equipment-types")]
[Authorize(Roles = "Admin")]
public class EquipmentTypesController : ControllerBase
{
    private readonly IEquipmentTypeService _equipmentTypeService;

    public EquipmentTypesController(IEquipmentTypeService equipmentTypeService)
    {
        _equipmentTypeService = equipmentTypeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEquipmentTypes([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? sortBy = null)
    {
        var @params = new PaginationParams { PageIndex = pageIndex, PageSize = pageSize, Search = search, SortBy = sortBy };
        var result = await _equipmentTypeService.GetEquipmentTypesAsync(@params);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetEquipmentTypeById(Guid id)
    {
        var equipmentType = await _equipmentTypeService.GetEquipmentTypeByIdAsync(id);
        if (equipmentType == null)
            return NotFound(new { message = "Equipment type not found" });
        return Ok(equipmentType);
    }

    [HttpPost]
    public async Task<IActionResult> CreateEquipmentType([FromBody] CreateEquipmentTypeDto dto)
    {
        try
        {
            var equipmentType = await _equipmentTypeService.CreateEquipmentTypeAsync(dto);
            return CreatedAtAction(nameof(GetEquipmentTypeById), new { id = equipmentType.Id }, equipmentType);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEquipmentType(Guid id, [FromBody] UpdateEquipmentTypeDto dto)
    {
        try
        {
            var equipmentType = await _equipmentTypeService.UpdateEquipmentTypeAsync(id, dto);
            if (equipmentType == null)
                return NotFound(new { message = "Equipment type not found" });
            return Ok(equipmentType);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEquipmentType(Guid id)
    {
        var result = await _equipmentTypeService.DeleteEquipmentTypeAsync(id);
        if (!result)
            return NotFound(new { message = "Equipment type not found" });
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var result = await _equipmentTypeService.UpdateStatusAsync(id, request.Status);
        if (!result)
            return NotFound(new { message = "Equipment type not found" });
        return Ok(new { message = "Status updated successfully" });
    }
}
