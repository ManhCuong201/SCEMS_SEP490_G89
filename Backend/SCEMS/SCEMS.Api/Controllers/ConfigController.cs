using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SCEMS.Application.Common;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfigController : ControllerBase
{
    private readonly BookingSettings _bookingSettings;

    public ConfigController(IOptions<BookingSettings> bookingSettings)
    {
        _bookingSettings = bookingSettings.Value;
    }

    [HttpGet("booking")]
    public IActionResult GetBookingSettings()
    {
        return Ok(_bookingSettings);
    }
}
