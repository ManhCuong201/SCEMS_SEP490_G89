using Microsoft.AspNetCore.SignalR;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;

namespace SCEMS.Api.Hubs;

public class SignalRNotificationDispatcher : INotificationDispatcher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationDispatcher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task DispatchToUserAsync(Guid userId, Notification notification)
    {
        await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notification);
    }
}
