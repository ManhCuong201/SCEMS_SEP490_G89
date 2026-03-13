using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs;
using SCEMS.Application.Services;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace SCEMS.Tests;

public class NotificationServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<INotificationDispatcher> _dispatcherMock;
    private readonly NotificationService _service;

    public NotificationServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _dispatcherMock = new Mock<INotificationDispatcher>();
        _service = new NotificationService(_uowMock.Object, _dispatcherMock.Object);
    }

    [Fact]
    public async Task SendNotificationAsync_AddsToRepoAndDispatches()
    {
        // Arrange
        var recipientId = Guid.NewGuid();
        var title = "Test Title";
        var message = "Test Message";

        // Act
        await _service.SendNotificationAsync(recipientId, title, message);

        // Assert
        _uowMock.Verify(u => u.Notifications.AddAsync(It.Is<Notification>(n => 
            n.RecipientId == recipientId && 
            n.Title == title && 
            n.Message == message && 
            !n.IsRead)), Times.Once);
        
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        
        _dispatcherMock.Verify(d => d.DispatchToUserAsync(recipientId, It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public async Task SendToRoleAsync_SendsToAllUsersInRole()
    {
        // Arrange
        var role = AccountRole.Student;
        var users = new List<Account>
        {
            new Account { Id = Guid.NewGuid(), Role = role },
            new Account { Id = Guid.NewGuid(), Role = role }
        };

        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(users.BuildMockDbSet());

        // Act
        await _service.SendToRoleAsync(role, "Title", "Message");

        // Assert
        _uowMock.Verify(u => u.Notifications.AddAsync(It.IsAny<Notification>()), Times.Exactly(2));
        _dispatcherMock.Verify(d => d.DispatchToUserAsync(It.IsAny<Guid>(), It.IsAny<Notification>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GetUserUnreadNotificationsAsync_ReturnsOnlyUnread()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = false, CreatedAt = DateTime.Now },
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = true, CreatedAt = DateTime.Now.AddMinutes(-5) }
        };

        _uowMock.Setup(u => u.Notifications.GetAll()).Returns(notifications.BuildMockDbSet());

        // Act
        var result = await _service.GetUserUnreadNotificationsAsync(userId);

        // Assert
        Assert.Single(result);
        Assert.False(result.First().IsRead);
    }

    [Fact]
    public async Task MarkAsReadAsync_UpdatesStatus()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, RecipientId = userId, IsRead = false };

        _uowMock.Setup(u => u.Notifications.GetByIdAsync(notificationId)).ReturnsAsync(notification);

        // Act
        await _service.MarkAsReadAsync(notificationId, userId);

        // Assert
        Assert.True(notification.IsRead);
        _uowMock.Verify(u => u.Notifications.Update(notification), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_UpdatesAllUnread()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = false },
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = false }
        };

        _uowMock.Setup(u => u.Notifications.GetAll()).Returns(notifications.BuildMockDbSet());

        // Act
        await _service.MarkAllAsReadAsync(userId);

        // Assert
        Assert.All(notifications, n => Assert.True(n.IsRead));
        _uowMock.Verify(u => u.Notifications.Update(It.IsAny<Notification>()), Times.Exactly(2));
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}
