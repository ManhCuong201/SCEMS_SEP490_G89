using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Equipment;
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

public class EquipmentServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<INotificationService> _notificationMock;
    private readonly EquipmentService _service;

    public EquipmentServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _notificationMock = new Mock<INotificationService>();
        _service = new EquipmentService(_uowMock.Object, _mapperMock.Object, _notificationMock.Object);
    }

    [Fact]
    public async Task DeleteEquipmentAsync_NotFound_ReturnsFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Equipment.GetByIdAsync(id)).ReturnsAsync((Equipment)null);

        // Act
        var result = await _service.DeleteEquipmentAsync(id);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task UpdateStatusAsync_NotFound_ReturnsFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Equipment.GetByIdAsync(id)).ReturnsAsync((Equipment)null);

        // Act
        var result = await _service.UpdateStatusAsync(id, (int)EquipmentStatus.Faulty);

        // Assert
        Assert.False(result);
    }
}
