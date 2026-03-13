using Moq;
using SCEMS.Application.DTOs.EquipmentType;
using SCEMS.Application.Services;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;
using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using System;

namespace SCEMS.Tests;

public class EquipmentTypeServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly EquipmentTypeService _service;

    public EquipmentTypeServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _service = new EquipmentTypeService(_uowMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task CreateEquipmentTypeAsync_DuplicateName_ThrowsException()
    {
        var dto = new CreateEquipmentTypeDto { Name = "Projector" };
        _uowMock.Setup(u => u.EquipmentTypes.GetByNameAsync(dto.Name)).ReturnsAsync(new EquipmentType());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateEquipmentTypeAsync(dto));
        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task GetEquipmentTypeByIdAsync_NotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.EquipmentTypes.GetByIdWithDetailsAsync(id)).ReturnsAsync((EquipmentType)null);

        var result = await _service.GetEquipmentTypeByIdAsync(id);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteEquipmentTypeAsync_ExistingId_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        var et = new EquipmentType { Id = id };
        _uowMock.Setup(u => u.EquipmentTypes.GetByIdAsync(id)).ReturnsAsync(et);

        var result = await _service.DeleteEquipmentTypeAsync(id);

        Assert.True(result);
        _uowMock.Verify(u => u.EquipmentTypes.Delete(et), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_Found_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        var et = new EquipmentType { Id = id, Status = SCEMS.Domain.Enums.EquipmentTypeStatus.Active };
        _uowMock.Setup(u => u.EquipmentTypes.GetByIdAsync(id)).ReturnsAsync(et);

        var result = await _service.UpdateStatusAsync(id, (int)SCEMS.Domain.Enums.EquipmentTypeStatus.Hidden);

        Assert.True(result);
        Assert.Equal(SCEMS.Domain.Enums.EquipmentTypeStatus.Hidden, et.Status);
    }
}
