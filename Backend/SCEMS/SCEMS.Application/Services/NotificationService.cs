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
    private readonly IEmailService _emailService;
    private readonly IConfigurationService _configService;

    public NotificationService(IUnitOfWork unitOfWork, INotificationDispatcher dispatcher, IEmailService emailService, IConfigurationService configService)
    {
        _unitOfWork = unitOfWork;
        _dispatcher = dispatcher;
        _emailService = emailService;
        _configService = configService;
    }

    public async Task SendNotificationAsync(Guid recipientId, string title, string message, string? link = null)
    {
        // 1. Save to DB
        var notification = new Notification
        {
            RecipientId = recipientId,
            Title = title,
            Message = message,
            Link = link,
            IsRead = false
        };

        await _unitOfWork.Notifications.AddAsync(notification);
        await _unitOfWork.SaveChangesAsync();

        // 2. Real-time push
        await _dispatcher.DispatchToUserAsync(recipientId, notification);

        // 3. Email notification
        var emailEnabled = await _configService.GetValueAsync("Notification.EmailEnabled", "true") == "true";
        if (emailEnabled)
        {
            var user = await _unitOfWork.Accounts.GetByIdAsync(recipientId);
            if (user != null && !string.IsNullOrEmpty(user.Email))
            {
                var body = $"<h3>{title}</h3><p>{message}</p>";
                if (!string.IsNullOrEmpty(link))
                {
                    body += $"<br/><a href='{link}'>Click here to view</a>";
                }
                await _emailService.SendEmailAsync(user.Email, title, body);
            }
        }
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
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, int count = 50)
    {
        return await _unitOfWork.Notifications.GetAll()
            .Where(n => n.RecipientId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(count)
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
            
        if (!unreadList.Any()) return;

        foreach (var notification in unreadList)
        {
            notification.IsRead = true;
            _unitOfWork.Notifications.Update(notification);
        }
        await _unitOfWork.SaveChangesAsync();
    }
}
