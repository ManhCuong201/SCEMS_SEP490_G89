using SCEMS.Application.DTOs;
using SCEMS.Domain.Entities;

namespace SCEMS.Application.Services.Interfaces;

public interface INotificationDispatcher
{
    Task DispatchToUserAsync(Guid userId, Notification notification);
    Task DispatchLogoutSignalAsync(Guid userId);
}
