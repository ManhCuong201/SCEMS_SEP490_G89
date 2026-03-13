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

    [Fact]
    public async Task CreateReportAsync_MissingTarget_ThrowsException()
    {
        // Arrange
        var dto = new CreateIssueReportDto { Description = "No target" };
        var userId = Guid.NewGuid();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateReportAsync(dto, userId));
        Assert.Contains("Either RoomId or EquipmentId must be provided", ex.Message);
    }

    [Fact]
    public async Task UpdateStatusAsync_NotFound_ReturnsNull()
    {
        // Arrange
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.IssueReports.GetByIdAsync(id)).ReturnsAsync((IssueReport)null);

        // Act
        var result = await _service.UpdateStatusAsync(id, IssueReportStatus.Resolved);

        // Assert
        Assert.Null(result);
    }
}
