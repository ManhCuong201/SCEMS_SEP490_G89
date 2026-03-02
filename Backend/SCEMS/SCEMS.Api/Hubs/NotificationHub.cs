using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace SCEMS.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override Task OnConnectedAsync()
    {
        // Users are automatically mapped by their NameIdentifier (AccountId) due to JWT mapping
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // Log connection if needed
        Console.WriteLine($"SignalR Connected: User {userId}, ConnectionId: {Context.ConnectionId}");
        
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"SignalR Disconnected: User {userId}, ConnectionId: {Context.ConnectionId}");
        
        return base.OnDisconnectedAsync(exception);
    }
}
