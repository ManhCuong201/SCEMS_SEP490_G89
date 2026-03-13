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

    // UTC_NS_01: Send notification persists to DB and dispatches via SignalR
    [Fact]
    public async Task SendNotificationAsync_AddsToRepoAndDispatches()
    {
        var recipientId = Guid.Parse("a7ce08bc-c385-48cf-9bcd-cb6683b3f91a"); // Hoàng Minh Trí
        var title = "Test Title";
        var message = "Test Message";

        await _service.SendNotificationAsync(recipientId, title, message);

        _uowMock.Verify(u => u.Notifications.AddAsync(It.Is<Notification>(n =>
            n.RecipientId == recipientId && n.Title == title && n.Message == message && !n.IsRead)), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        _dispatcherMock.Verify(d => d.DispatchToUserAsync(recipientId, It.IsAny<Notification>()), Times.Once);
    }

    // UTC_NS_02: SendToRole dispatches to all users with matching role
    [Fact]
    public async Task SendToRoleAsync_SendsToAllUsersInRole()
    {
        var role = AccountRole.Student;
        var users = new List<Account>
        {
            new Account { Id = Guid.NewGuid(), Role = role },
            new Account { Id = Guid.NewGuid(), Role = role }
        };
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(users.BuildMockDbSet());

        await _service.SendToRoleAsync(role, "Title", "Message");

        _uowMock.Verify(u => u.Notifications.AddAsync(It.IsAny<Notification>()), Times.Exactly(2));
        _dispatcherMock.Verify(d => d.DispatchToUserAsync(It.IsAny<Guid>(), It.IsAny<Notification>()), Times.Exactly(2));
    }

    // UTC_NS_03: SendToRole with empty user list sends nothing
    [Fact]
    public async Task SendToRoleAsync_EmptyRole_SendsNothing()
    {
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());

        await _service.SendToRoleAsync(AccountRole.BookingStaff, "Title", "Message");

        _uowMock.Verify(u => u.Notifications.AddAsync(It.IsAny<Notification>()), Times.Never);
        _dispatcherMock.Verify(d => d.DispatchToUserAsync(It.IsAny<Guid>(), It.IsAny<Notification>()), Times.Never);
    }

    // UTC_NS_04: GetUserUnreadNotificationsAsync returns only unread
    [Fact]
    public async Task GetUserUnreadNotificationsAsync_ReturnsOnlyUnread()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = false, CreatedAt = DateTime.Now },
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = true, CreatedAt = DateTime.Now.AddMinutes(-5) }
        };
        _uowMock.Setup(u => u.Notifications.GetAll()).Returns(notifications.BuildMockDbSet());

        var result = await _service.GetUserUnreadNotificationsAsync(userId);

        Assert.Single(result);
        Assert.False(result.First().IsRead);
    }

    // UTC_NS_05: GetUserUnreadNotificationsAsync with all read returns empty
    [Fact]
    public async Task GetUserUnreadNotificationsAsync_AllRead_ReturnsEmpty()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = true, CreatedAt = DateTime.Now }
        };
        _uowMock.Setup(u => u.Notifications.GetAll()).Returns(notifications.BuildMockDbSet());

        var result = await _service.GetUserUnreadNotificationsAsync(userId);

        Assert.Empty(result);
    }

    // UTC_NS_06: MarkAsReadAsync updates IsRead to true
    [Fact]
    public async Task MarkAsReadAsync_UpdatesStatus()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, RecipientId = userId, IsRead = false };
        _uowMock.Setup(u => u.Notifications.GetByIdAsync(notificationId)).ReturnsAsync(notification);

        await _service.MarkAsReadAsync(notificationId, userId);

        Assert.True(notification.IsRead);
        _uowMock.Verify(u => u.Notifications.Update(notification), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_NS_07: MarkAllAsReadAsync marks all unread as read
    [Fact]
    public async Task MarkAllAsReadAsync_UpdatesAllUnread()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = false },
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = false }
        };
        _uowMock.Setup(u => u.Notifications.GetAll()).Returns(notifications.BuildMockDbSet());

        await _service.MarkAllAsReadAsync(userId);

        Assert.All(notifications, n => Assert.True(n.IsRead));
        _uowMock.Verify(u => u.Notifications.Update(It.IsAny<Notification>()), Times.Exactly(2));
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_NS_08: MarkAllAsReadAsync with no unread does not call Update
    [Fact]
    public async Task MarkAllAsReadAsync_NoUnread_DoesNotCallUpdate()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { Id = Guid.NewGuid(), RecipientId = userId, IsRead = true }
        };
        _uowMock.Setup(u => u.Notifications.GetAll()).Returns(notifications.BuildMockDbSet());

        await _service.MarkAllAsReadAsync(userId);

        _uowMock.Verify(u => u.Notifications.Update(It.IsAny<Notification>()), Times.Never);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }
}
