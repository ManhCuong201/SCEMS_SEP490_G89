using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.IssueReport;
using SCEMS.Application.Services;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace SCEMS.Tests;

public class IssueReportServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<INotificationService> _notificationMock;
    private readonly IssueReportService _service;

    public IssueReportServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _notificationMock = new Mock<INotificationService>();
        _service = new IssueReportService(_uowMock.Object, _mapperMock.Object, _notificationMock.Object);
    }

    // UTC_IR_01: Create report without RoomId or EquipmentId throws exception
    [Fact]
    public async Task CreateReportAsync_MissingTarget_ThrowsException()
    {
        var dto = new CreateIssueReportDto { Description = "No target" };
        var userId = Guid.Parse("a7ce08bc-c385-48cf-9bcd-cb6683b3f91a"); // Hoàng Minh Trí

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateReportAsync(dto, userId));
        Assert.Contains("Either RoomId or EquipmentId must be provided", ex.Message);
    }

    // UTC_IR_02: Create report with RoomId succeeds
    [Fact]
    public async Task CreateReportAsync_WithRoomId_CreatesReport()
    {
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var dto = new CreateIssueReportDto { Description = "Door broken", RoomId = roomId };
        var expectedReport = new IssueReport { Id = Guid.NewGuid(), RoomId = roomId, CreatedBy = userId };

        _uowMock.Setup(u => u.IssueReports.AddAsync(It.IsAny<IssueReport>())).Returns(Task.CompletedTask);
        _uowMock.Setup(u => u.IssueReports.GetAll()).Returns(new List<IssueReport> { expectedReport }.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<IssueReport>(dto)).Returns(expectedReport);
        _mapperMock.Setup(m => m.Map<IssueReportResponseDto>(It.IsAny<IssueReport>())).Returns(new IssueReportResponseDto());
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());
        _uowMock.Setup(u => u.Rooms.GetAll()).Returns(new List<Room>().BuildMockDbSet());
        _uowMock.Setup(u => u.Equipment.GetAll()).Returns(new List<Equipment>().BuildMockDbSet());

        var result = await _service.CreateReportAsync(dto, userId);

        _uowMock.Verify(u => u.IssueReports.AddAsync(It.IsAny<IssueReport>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_IR_03: Create report with EquipmentId succeeds
    [Fact]
    public async Task CreateReportAsync_WithEquipmentId_CreatesReport()
    {
        var equipId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var dto = new CreateIssueReportDto { Description = "Projector broken", EquipmentId = equipId };
        var expectedReport = new IssueReport { Id = Guid.NewGuid(), EquipmentId = equipId, CreatedBy = userId };

        _uowMock.Setup(u => u.IssueReports.AddAsync(It.IsAny<IssueReport>())).Returns(Task.CompletedTask);
        _uowMock.Setup(u => u.IssueReports.GetAll()).Returns(new List<IssueReport> { expectedReport }.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<IssueReport>(dto)).Returns(expectedReport);
        _mapperMock.Setup(m => m.Map<IssueReportResponseDto>(It.IsAny<IssueReport>())).Returns(new IssueReportResponseDto());
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());
        _uowMock.Setup(u => u.Rooms.GetAll()).Returns(new List<Room>().BuildMockDbSet());
        _uowMock.Setup(u => u.Equipment.GetAll()).Returns(new List<Equipment>().BuildMockDbSet());

        var result = await _service.CreateReportAsync(dto, userId);

        _uowMock.Verify(u => u.IssueReports.AddAsync(It.IsAny<IssueReport>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_IR_04: Update status of non-existent report returns null
    [Fact]
    public async Task UpdateStatusAsync_NotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.IssueReports.GetByIdAsync(id)).ReturnsAsync((IssueReport)null!);

        var result = await _service.UpdateStatusAsync(id, IssueReportStatus.Resolved);

        Assert.Null(result);
    }

    // UTC_IR_05: Update status of existing report changes status
    [Fact]
    public async Task UpdateStatusAsync_Found_ChangesStatus()
    {
        var id = Guid.NewGuid();
        var report = new IssueReport { Id = id, Status = IssueReportStatus.Open };
        _uowMock.Setup(u => u.IssueReports.GetByIdAsync(id)).ReturnsAsync(report);
        _uowMock.Setup(u => u.IssueReports.GetAll()).Returns(new List<IssueReport> { report }.BuildMockDbSet());
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());
        _uowMock.Setup(u => u.Rooms.GetAll()).Returns(new List<Room>().BuildMockDbSet());
        _uowMock.Setup(u => u.Equipment.GetAll()).Returns(new List<Equipment>().BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<IssueReportResponseDto>(It.IsAny<IssueReport>())).Returns(new IssueReportResponseDto());

        await _service.UpdateStatusAsync(id, IssueReportStatus.Resolved);

        Assert.Equal(IssueReportStatus.Resolved, report.Status);
        _uowMock.Verify(u => u.IssueReports.Update(report), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}
