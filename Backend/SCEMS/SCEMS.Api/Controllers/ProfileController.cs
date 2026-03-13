using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.DTOs.Profile;
using SCEMS.Application.Services.Interfaces;
using System.Security.Claims;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var profile = await _profileService.GetProfileAsync(userId);
        if (profile == null) return NotFound(new { message = "Profile not found" });

        return Ok(profile);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        try
        {
            var updatedProfile = await _profileService.UpdateProfileAsync(userId, dto);
            return Ok(updatedProfile);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var result = await _profileService.ChangePasswordAsync(userId, dto);
        if (!result)
        {
            return BadRequest(new { message = "Incorrect current password" });
        }

        return Ok(new { message = "Password updated successfully" });
    }
}
