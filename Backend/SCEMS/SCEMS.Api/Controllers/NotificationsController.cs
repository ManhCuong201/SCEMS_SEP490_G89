using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Services.Interfaces;
using System.Security.Claims;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetUnread()
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(uid, out var userId))
            return Unauthorized();

        var notifications = await _notificationService.GetUserUnreadNotificationsAsync(userId);
        return Ok(notifications);
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int count = 50)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(uid, out var userId))
            return Unauthorized();

        var notifications = await _notificationService.GetUserNotificationsAsync(userId, count);
        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(uid, out var userId) || !Guid.TryParse(id, out var notifId))
            return Unauthorized();

        await _notificationService.MarkAsReadAsync(notifId, userId);
        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var uid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(uid, out var userId))
            return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }
}
