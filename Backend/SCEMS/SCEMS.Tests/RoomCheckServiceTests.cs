using Moq;
using SCEMS.Application.DTOs.IssueReport;
using SCEMS.Application.DTOs.RoomCheck;
using SCEMS.Application.Services;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using System;

namespace SCEMS.Tests;

public class RoomCheckServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IIssueReportService> _issueReportMock;
    private readonly RoomCheckService _service;

    public RoomCheckServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _issueReportMock = new Mock<IIssueReportService>();
        _service = new RoomCheckService(_uowMock.Object, _issueReportMock.Object);
    }

    [Fact]
    public async Task GetPendingChecksAsync_NoActivity_ReturnsEmpty()
    {
        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(new List<Booking>().BuildMockDbSet());
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(new List<Teaching_Schedule>().BuildMockDbSet());
        _uowMock.Setup(u => u.IssueReports.GetAll()).Returns(new List<IssueReport>().BuildMockDbSet());
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());
        _uowMock.Setup(u => u.Rooms.GetAll()).Returns(new List<Room>().BuildMockDbSet());
        _uowMock.Setup(u => u.Equipment.GetAll()).Returns(new List<Equipment>().BuildMockDbSet());

        var result = await _service.GetPendingChecksAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetPendingChecksAsync_ActivityFinished_ReturnsPending()
    {
        var roomId = Guid.NewGuid();
        var room = new Room { Id = roomId, RoomName = "R1", RoomCode = "C1" };
        var booking = new Booking 
        { 
            RoomId = roomId, 
            Room = room, 
            TimeSlot = DateTime.Today.AddHours(8), 
            Duration = 1, 
            Status = BookingStatus.Completed 
        };

        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(new List<Booking> { booking }.BuildMockDbSet());
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(new List<Teaching_Schedule>().BuildMockDbSet());
        _uowMock.Setup(u => u.IssueReports.GetAll()).Returns(new List<IssueReport>().BuildMockDbSet());
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());
        _uowMock.Setup(u => u.Rooms.GetAll()).Returns(new List<Room>().BuildMockDbSet());
        _uowMock.Setup(u => u.Equipment.GetAll()).Returns(new List<Equipment>().BuildMockDbSet());

        var result = await _service.GetPendingChecksAsync();

        Assert.Single(result);
        Assert.Equal("R1", result[0].RoomName);
    }

    [Fact]
    public async Task GetPendingChecksAsync_AlreadyCheckedToday_Skips()
    {
        var roomId = Guid.NewGuid();
        var room = new Room { Id = roomId, RoomName = "R1", RoomCode = "C1" };
        var booking = new Booking 
        { 
            RoomId = roomId, 
            Room = room, 
            TimeSlot = DateTime.Today.AddHours(8), 
            Duration = 1, 
            Status = BookingStatus.Completed 
        };

        var guardId = Guid.NewGuid();
        var guard = new Account { Id = guardId, Role = AccountRole.Guard };
        var report = new IssueReport 
        { 
            RoomId = roomId, 
            CreatedByAccount = guard, 
            CreatedAt = DateTime.Now 
        };

        _uowMock.Setup(u => u.Bookings.GetAll()).Returns(new List<Booking> { booking }.BuildMockDbSet());
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(new List<Teaching_Schedule>().BuildMockDbSet());
        _uowMock.Setup(u => u.IssueReports.GetAll()).Returns(new List<IssueReport> { report }.BuildMockDbSet());
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());
        _uowMock.Setup(u => u.Rooms.GetAll()).Returns(new List<Room>().BuildMockDbSet());
        _uowMock.Setup(u => u.Equipment.GetAll()).Returns(new List<Equipment>().BuildMockDbSet());

        var result = await _service.GetPendingChecksAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task CompleteCheckAsync_CallsCreateReportAndClose()
    {
        var roomId = Guid.NewGuid();
        var guardId = Guid.NewGuid();
        var dto = new CompleteRoomCheckDto { RoomId = roomId, Note = "All good" };
        var reportResponse = new IssueReportResponseDto { Id = Guid.NewGuid() };

        _issueReportMock.Setup(s => s.CreateReportAsync(It.IsAny<CreateIssueReportDto>(), guardId))
            .ReturnsAsync(reportResponse);

        await _service.CompleteCheckAsync(dto, guardId);

        _issueReportMock.Verify(s => s.CreateReportAsync(It.Is<CreateIssueReportDto>(d => d.RoomId == roomId && d.Description.Contains("All good")), guardId), Times.Once);
        _issueReportMock.Verify(s => s.UpdateStatusAsync(reportResponse.Id, IssueReportStatus.Closed), Times.Once);
    }
}
