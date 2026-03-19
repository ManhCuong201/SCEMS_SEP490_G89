using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Enums;
using System.Threading.Tasks;

namespace SCEMS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConfigurationController : ControllerBase
{
    private readonly IConfigurationService _configurationService;

    public ConfigurationController(IConfigurationService configurationService)
    {
        _configurationService = configurationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllSettings()
    {
        var settings = await _configurationService.GetAllSettingsAsync();
        return Ok(settings);
    }

    [HttpGet("{key}")]
    public async Task<IActionResult> GetSetting(string key)
    {
        var setting = await _configurationService.GetSettingAsync(key);
        if (setting == null) return NotFound();
        return Ok(setting);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingRequest request)
    {
        await _configurationService.UpdateSettingAsync(key, request.Value, request.Description);
        return Ok(new { message = $"Setting '{key}' updated successfully." });
    }
}

public class UpdateSettingRequest
{
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}
