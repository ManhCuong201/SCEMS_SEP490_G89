using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Booking;
using SCEMS.Application.Services;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;
using Microsoft.Extensions.Options;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace SCEMS.Tests;

public class BookingServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<INotificationService> _notificationMock;
    private readonly Mock<IConfigurationService> _configMock;
    private readonly BookingService _service;

    public BookingServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _notificationMock = new Mock<INotificationService>();
        _configMock = new Mock<IConfigurationService>();

        // Default config setups to match previous static settings
        _configMock.Setup(c => c.GetValueAsync("Booking.StartHour", It.IsAny<int>())).ReturnsAsync(7);
        _configMock.Setup(c => c.GetValueAsync("Booking.EndHour", It.IsAny<int>())).ReturnsAsync(22);
        _configMock.Setup(c => c.GetValueAsync("Booking.SlotDurationMinutes", It.IsAny<int>())).ReturnsAsync(60);
        _configMock.Setup(c => c.GetValueAsync("Booking.MaxDurationHours", It.IsAny<int>())).ReturnsAsync(4);
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(new List<Booking>().BuildMockDbSet());
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(new List<Teaching_Schedule>().BuildMockDbSet());
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(new List<ClassStudent>().BuildMockDbSet());

        _service = new BookingService(_uowMock.Object, _mapperMock.Object, _configMock.Object, _notificationMock.Object);
    }

    [Fact]
    public async Task CreateBookingAsync_PastTime_ThrowsException()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            TimeSlot = DateTime.Now.AddDays(-1), // Definitive past time
            Duration = 1,
            Reason = "Test"
        };
        var userId = Guid.NewGuid();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, userId));
        Assert.Contains("thời gian đã qua", ex.Message);
    }

    [Fact]
    public async Task CreateBookingAsync_OutsideHours_ThrowsException()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            TimeSlot = DateTime.Today.AddDays(7).AddHours(23), // 11 PM
            Duration = 1,
            Reason = "Outside hours"
        };
        var userId = Guid.NewGuid();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, userId));
        Assert.Contains("Thời gian mượn phòng phải trong khoảng", ex.Message);
    }

    [Fact]
    public async Task CreateBookingAsync_InvalidDuration_ThrowsException()
    {
        // Arrange
        var dto = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            TimeSlot = DateTime.Today.AddDays(7).AddHours(10),
            Duration = 5, // Violates MaxDurationHours (4)
            Reason = "Invalid duration"
        };
        var userId = Guid.NewGuid();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, userId));
        Assert.Contains("Thời lượng mượn phòng", ex.Message);
    }

    [Fact]
    public async Task CreateBookingAsync_RoomConflict_ThrowsException()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var timeSlot = DateTime.Today.AddDays(7).AddHours(10);
        var dto = new CreateBookingDto
        {
            RoomId = roomId,
            TimeSlot = timeSlot,
            Duration = 1,
            Reason = "Test conflict"
        };
        var userId = Guid.NewGuid();

        _uowMock.Setup(u => u.Rooms.GetByIdAsync(roomId)).ReturnsAsync(new Room { Id = roomId, Status = RoomStatus.Available });
        
        var existingBookings = new List<Booking>
        {
            new Booking { RoomId = roomId, TimeSlot = timeSlot, Duration = 1, Status = BookingStatus.Approved }
        }.BuildMockDbSet();
        
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(existingBookings);
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(new List<Teaching_Schedule>().BuildMockDbSet());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, userId));
        Assert.Contains("Phòng này đã có người khác mượn", ex.Message);
    }

    [Fact]
    public async Task UpdateStatusAsync_Approved_SendsNotifications()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = bookingId,
            RequestedBy = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            Status = BookingStatus.Pending,
            TimeSlot = DateTime.Now.AddDays(7),
            Duration = 1,
            Room = new Room { RoomName = "A101" }
        };

        var bookings = new List<Booking> { booking }.BuildMockDbSet();
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(bookings);
        _uowMock.Setup(u => u.Bookings.GetByIdAsync(bookingId)).ReturnsAsync(booking);

        // Act
        await _service.UpdateStatusAsync(bookingId, BookingStatus.Approved);

        // Assert
        _notificationMock.Verify(n => n.SendNotificationAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.AtLeastOnce());
    }
}
