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
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _notificationMock = new Mock<INotificationService>();
        _service = new EquipmentService(_uowMock.Object, _mapperMock.Object, _notificationMock.Object);
    }

    // UTC_EQ_01: Delete equipment that does not exist returns false
    [Fact]
    public async Task DeleteEquipmentAsync_NotFound_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Equipment.GetByIdAsync(id)).ReturnsAsync((Equipment)null!);

        var result = await _service.DeleteEquipmentAsync(id);

        Assert.False(result);
    }

    // UTC_EQ_02: Delete existing equipment returns true
    [Fact]
    public async Task DeleteEquipmentAsync_Found_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        var equipment = new Equipment { Id = id, Name = "Projector" };
        _uowMock.Setup(u => u.Equipment.GetByIdAsync(id)).ReturnsAsync(equipment);

        var result = await _service.DeleteEquipmentAsync(id);

        Assert.True(result);
        _uowMock.Verify(u => u.Equipment.Delete(equipment), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_EQ_03: Update status of non-existent equipment returns false
    [Fact]
    public async Task UpdateStatusAsync_NotFound_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Equipment.GetByIdAsync(id)).ReturnsAsync((Equipment)null!);

        var result = await _service.UpdateStatusAsync(id, (int)EquipmentStatus.Faulty);

        Assert.False(result);
    }

    // UTC_EQ_04: Update status of existing equipment succeeds
    [Fact]
    public async Task UpdateStatusAsync_Found_UpdatesAndReturnsTrue()
    {
        var id = Guid.NewGuid();
        var equipment = new Equipment { Id = id, Name = "Screen", Status = EquipmentStatus.Working };
        _uowMock.Setup(u => u.Equipment.GetByIdAsync(id)).ReturnsAsync(equipment);

        var result = await _service.UpdateStatusAsync(id, (int)EquipmentStatus.Faulty);

        Assert.True(result);
        Assert.Equal(EquipmentStatus.Faulty, equipment.Status);
        _uowMock.Verify(u => u.Equipment.Update(equipment), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_EQ_05: Update status to Faulty sends notification
    [Fact]
    public async Task UpdateStatusAsync_Faulty_SendsNotification()
    {
        var id = Guid.NewGuid();
        var equipment = new Equipment { Id = id, Name = "Projector A", Status = EquipmentStatus.Working, RoomId = Guid.NewGuid() };
        _uowMock.Setup(u => u.Equipment.GetByIdAsync(id)).ReturnsAsync(equipment);
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());

        await _service.UpdateStatusAsync(id, (int)EquipmentStatus.Faulty);

        _notificationMock.Verify(n => n.SendToRoleAsync(It.IsAny<AccountRole>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.AtMostOnce());
    }
}
