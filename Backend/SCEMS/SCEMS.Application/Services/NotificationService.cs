using SCEMS.Application.DTOs;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace SCEMS.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationDispatcher _dispatcher;

    public NotificationService(IUnitOfWork unitOfWork, INotificationDispatcher dispatcher)
    {
        _unitOfWork = unitOfWork;
        _dispatcher = dispatcher;
    }

    public async Task SendNotificationAsync(Guid recipientId, string title, string message, string? link = null)
    {
        var notification = new Notification
        {
            RecipientId = recipientId,
            Title = title,
            Message = message,
            Link = link,
            IsRead = false
        };

        var repo = _unitOfWork.Notifications;
        await repo.AddAsync(notification);
        await _unitOfWork.SaveChangesAsync();

        // Push real-time event to the specific user via the abstracted dispatcher
        await _dispatcher.DispatchToUserAsync(recipientId, notification);
    }

    public async Task SendToRoleAsync(AccountRole role, string title, string message, string? link = null)
    {
        var roleUsers = await _unitOfWork.Accounts.GetAll()
            .Where(a => a.Role == role)
            .Select(a => a.Id)
            .ToListAsync();

        foreach (var userId in roleUsers)
        {
            await SendNotificationAsync(userId, title, message, link);
        }
    }

    public async Task<IEnumerable<Notification>> GetUserUnreadNotificationsAsync(Guid userId)
    {
        return await _unitOfWork.Notifications.GetAll()
            .Where(n => n.RecipientId == userId && !n.IsRead)
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _unitOfWork.Notifications.GetByIdAsync(notificationId);
        if (notification != null && notification.RecipientId == userId)
        {
            notification.IsRead = true;
            _unitOfWork.Notifications.Update(notification);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unreadList = await _unitOfWork.Notifications.GetAll()
            .Where(n => n.RecipientId == userId && !n.IsRead)
            .ToListAsync();
        foreach (var notification in unreadList)
        {
            notification.IsRead = true;
            _unitOfWork.Notifications.Update(notification);
        }
        await _unitOfWork.SaveChangesAsync();
    }
}
