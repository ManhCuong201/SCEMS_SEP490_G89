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

        _configMock.Setup(c => c.GetValueAsync("Booking.StartHour", It.IsAny<int>())).ReturnsAsync(7);
        _configMock.Setup(c => c.GetValueAsync("Booking.EndHour", It.IsAny<int>())).ReturnsAsync(22);
        _configMock.Setup(c => c.GetValueAsync("Booking.SlotDurationMinutes", It.IsAny<int>())).ReturnsAsync(60);
        _configMock.Setup(c => c.GetValueAsync("Booking.MaxDurationHours", It.IsAny<int>())).ReturnsAsync(4);
        _configMock.Setup(c => c.GetValueAsync("Booking.MaxPerWeek", It.IsAny<int>())).ReturnsAsync(5);
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(new List<Booking>().BuildMockDbSet());
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(new List<Teaching_Schedule>().BuildMockDbSet());
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(new List<ClassStudent>().BuildMockDbSet());

        _service = new BookingService(_uowMock.Object, _mapperMock.Object, _configMock.Object, _notificationMock.Object);
    }

    // UTC_BS_01: Booking in past time
    [Fact]
    public async Task CreateBookingAsync_PastTime_ThrowsException()
    {
        var lectureId = Guid.Parse("800ae92e-74be-4e81-b419-f8a8e426f95b"); // Phạm Thu Hà
        var dto = new CreateBookingDto { RoomId = Guid.NewGuid(), TimeSlot = DateTime.Now.AddDays(-1), Duration = 1, Reason = "Học PRN231" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, lectureId));
        Assert.Contains("thời gian đã qua", ex.Message);
    }

    // UTC_BS_02: Booking before opening hours
    [Fact]
    public async Task CreateBookingAsync_OutsideHours_BeforeOpen_ThrowsException()
    {
        var studentId = Guid.Parse("a7ce08bc-c385-48cf-9bcd-cb6683b3f91a"); // Hoàng Minh Trí
        var dto = new CreateBookingDto { RoomId = Guid.NewGuid(), TimeSlot = DateTime.Today.AddDays(7).AddHours(5), Duration = 1, Reason = "Early" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, studentId));
        Assert.Contains("Thời gian mượn phòng phải trong khoảng", ex.Message);
    }

    // UTC_BS_03: Booking after closing hours
    [Fact]
    public async Task CreateBookingAsync_OutsideHours_AfterClose_ThrowsException()
    {
        var studentId = Guid.Parse("a7ce08bc-c385-48cf-9bcd-cb6683b3f91a"); // Hoàng Minh Trí
        var dto = new CreateBookingDto { RoomId = Guid.NewGuid(), TimeSlot = DateTime.Today.AddDays(7).AddHours(23), Duration = 1, Reason = "Late" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, studentId));
        Assert.Contains("Thời gian mượn phòng phải trong khoảng", ex.Message);
    }

    // UTC_BS_04: Duration exceeds max
    [Fact]
    public async Task CreateBookingAsync_InvalidDuration_ExceedsMax_ThrowsException()
    {
        var dto = new CreateBookingDto { RoomId = Guid.NewGuid(), TimeSlot = DateTime.Today.AddDays(7).AddHours(10), Duration = 5, Reason = "Too long" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, Guid.NewGuid()));
        Assert.Contains("Thời lượng mượn phòng", ex.Message);
    }

    // UTC_BS_05: Zero duration
    [Fact]
    public async Task CreateBookingAsync_ZeroDuration_ThrowsException()
    {
        var dto = new CreateBookingDto { RoomId = Guid.NewGuid(), TimeSlot = DateTime.Today.AddDays(7).AddHours(10), Duration = 0, Reason = "Zero" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, Guid.NewGuid()));
        Assert.Contains("Thời lượng mượn phòng", ex.Message);
    }

    // UTC_BS_06: Room does not exist
    [Fact]
    public async Task CreateBookingAsync_RoomNotFound_ThrowsException()
    {
        var roomId = Guid.NewGuid();
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(roomId)).ReturnsAsync((Room)null!);

        var dto = new CreateBookingDto { RoomId = roomId, TimeSlot = DateTime.Today.AddDays(7).AddHours(10), Duration = 1, Reason = "No room" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, Guid.NewGuid()));
        Assert.Contains("Không tìm thấy phòng", ex.Message);
    }

    // UTC_BS_07: Room is under maintenance
    [Fact]
    public async Task CreateBookingAsync_RoomUnavailable_ThrowsException()
    {
        var roomId = Guid.NewGuid();
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(roomId)).ReturnsAsync(new Room { Id = roomId, Status = RoomStatus.Disabled });

        var dto = new CreateBookingDto { RoomId = roomId, TimeSlot = DateTime.Today.AddDays(7).AddHours(10), Duration = 1, Reason = "Maintenance" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, Guid.NewGuid()));
        Assert.Contains("Phòng hiện không khả dụng", ex.Message);
    }

    // UTC_BS_08: Conflicting approved booking exists
    [Fact]
    public async Task CreateBookingAsync_BookingConflict_ThrowsException()
    {
        var roomId = Guid.NewGuid();
        var timeSlot = DateTime.Today.AddDays(7).AddHours(10);
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(roomId)).ReturnsAsync(new Room { Id = roomId, Status = RoomStatus.Available });

        var existingBookings = new List<Booking>
        {
            new Booking { RoomId = roomId, TimeSlot = timeSlot, Duration = 1, Status = BookingStatus.Approved }
        }.BuildMockDbSet();
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(existingBookings);

        var dto = new CreateBookingDto { RoomId = roomId, TimeSlot = timeSlot, Duration = 1, Reason = "Conflict" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, Guid.NewGuid()));
        Assert.Contains("Phòng này đã có người khác mượn", ex.Message);
    }

    // UTC_BS_09: Teaching schedule conflict for same room
    [Fact]
    public async Task CreateBookingAsync_TeachingScheduleConflict_ThrowsException()
    {
        var roomId = Guid.NewGuid();
        var timeSlot = DateTime.Today.AddDays(7).AddHours(10);
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(roomId)).ReturnsAsync(new Room { Id = roomId, Status = RoomStatus.Available });

        var schedules = new List<Teaching_Schedule>
        {
            new Teaching_Schedule { RoomId = roomId, Date = timeSlot.Date, StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(12, 0, 0) }
        }.BuildMockDbSet();
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(schedules);

        var dto = new CreateBookingDto { RoomId = roomId, TimeSlot = timeSlot, Duration = 1, Reason = "TS conflict" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, Guid.NewGuid()));
        Assert.Contains("đã được xếp lịch dạy lớp", ex.Message);
    }

    // UTC_BS_10: Weekly booking limit reached
    [Fact]
    public async Task CreateBookingAsync_WeeklyLimitExceeded_ThrowsException()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var timeSlot = DateTime.Today.AddDays(7).AddHours(10);
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(roomId)).ReturnsAsync(new Room { Id = roomId, Status = RoomStatus.Available });

        var startOfWeek = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek + (int)DayOfWeek.Monday);
        var weeklyBookings = Enumerable.Range(0, 5).Select(_ => new Booking
        {
            RequestedBy = userId, CreatedAt = startOfWeek.AddHours(1), Status = BookingStatus.Pending,
            TimeSlot = timeSlot.AddHours(-24), Duration = 1, RoomId = Guid.NewGuid()
        }).ToList().BuildMockDbSet();
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(weeklyBookings);

        var dto = new CreateBookingDto { RoomId = roomId, TimeSlot = timeSlot, Duration = 1, Reason = "Limit" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBookingAsync(dto, userId));
        Assert.Contains("giới hạn mượn phòng tối đa", ex.Message);
    }

    // UTC_BS_11: Approve booking triggers notification
    [Fact]
    public async Task UpdateStatusAsync_Approved_SendsNotification()
    {
        var bookingId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = bookingId, RequestedBy = Guid.NewGuid(), RoomId = Guid.NewGuid(),
            Status = BookingStatus.Pending, TimeSlot = DateTime.Now.AddDays(7), Duration = 1,
            Room = new Room { RoomName = "A101" }
        };
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(new List<Booking> { booking }.BuildMockDbSet());
        _uowMock.Setup(u => u.Bookings.GetByIdAsync(bookingId)).ReturnsAsync(booking);

        await _service.UpdateStatusAsync(bookingId, BookingStatus.Approved);

        _notificationMock.Verify(n => n.SendNotificationAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.AtLeastOnce());
    }

    // UTC_BS_12: Update status for non-existent booking returns null
    [Fact]
    public async Task UpdateStatusAsync_NotFound_ReturnsNull()
    {
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(new List<Booking>().BuildMockDbSet());

        var result = await _service.UpdateStatusAsync(Guid.NewGuid(), BookingStatus.Approved);

        Assert.Null(result);
    }
}
