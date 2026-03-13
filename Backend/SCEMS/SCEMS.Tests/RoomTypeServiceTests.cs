using Moq;
using SCEMS.Application.DTOs.RoomType;
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

public class RoomTypeServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly RoomTypeService _service;

    public RoomTypeServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _service = new RoomTypeService(_uowMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllRoomTypes()
    {
        var types = new List<RoomType> { new RoomType { Id = Guid.NewGuid() } }.BuildMockDbSet();
        _uowMock.Setup(u => u.RoomTypes.GetAll()).Returns(types);
        _mapperMock.Setup(m => m.Map<IEnumerable<RoomTypeDto>>(It.IsAny<IEnumerable<RoomType>>()))
            .Returns(new List<RoomTypeDto> { new RoomTypeDto() });

        var result = await _service.GetAllAsync();

        Assert.Single(result);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsRoomType()
    {
        var id = Guid.NewGuid();
        var type = new RoomType { Id = id };
        var types = new List<RoomType> { type }.BuildMockDbSet();
        _uowMock.Setup(u => u.RoomTypes.GetAll()).Returns(types);
        _mapperMock.Setup(m => m.Map<RoomTypeDto>(type)).Returns(new RoomTypeDto { Id = id });

        var result = await _service.GetByIdAsync(id);

        Assert.NotNull(result);
        Assert.Equal(id, result.Id);
    }

    [Fact]
    public async Task CreateAsync_CallsAddAndSave()
    {
        var dto = new CreateRoomTypeDto { Name = "Lab" };
        var type = new RoomType { Name = "Lab" };
        _mapperMock.Setup(m => m.Map<RoomType>(dto)).Returns(type);

        await _service.CreateAsync(dto);

        _uowMock.Verify(u => u.RoomTypes.AddAsync(type), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_NonExistingId_ThrowsException()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.RoomTypes.GetByIdAsync(id)).ReturnsAsync((RoomType)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.DeleteAsync(id));
    }
}
