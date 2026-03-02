using SCEMS.Application.DTOs;
using SCEMS.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SCEMS.Application.Services.Interfaces;

using SCEMS.Domain.Enums;

public interface INotificationService
{
    Task SendNotificationAsync(Guid recipientId, string title, string message, string? link = null);
    Task SendToRoleAsync(AccountRole role, string title, string message, string? link = null);
    Task<IEnumerable<Notification>> GetUserUnreadNotificationsAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
}
