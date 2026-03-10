using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Schedule;
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

public class TeachingScheduleServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IImportService> _importServiceMock;
    private readonly TeachingScheduleService _service;

    public TeachingScheduleServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _importServiceMock = new Mock<IImportService>();
        _service = new TeachingScheduleService(_uowMock.Object, _mapperMock.Object, _importServiceMock.Object);
    }

    [Fact]
    public async Task GetMyScheduleAsync_UserNotFound_ReturnsEmptyList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(userId)).ReturnsAsync((Account)null);

        // Act
        var result = await _service.GetMyScheduleAsync(userId, DateTime.Today, DateTime.Today.AddDays(7));

        // Assert
        Assert.Empty(result);
    }
}
