using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Room;
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

public class RoomServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly RoomService _service;

    public RoomServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _service = new RoomService(_uowMock.Object, _mapperMock.Object);
    }

    // UTC_RM_01: Create room with duplicate code throws exception
    [Fact]
    public async Task CreateRoomAsync_DuplicateCode_ThrowsException()
    {
        var dto = new CreateRoomDto { RoomCode = "AL-R203", RoomName = "Lab Alpha 203" };
        _uowMock.Setup(u => u.Rooms.GetByRoomCodeAsync(dto.RoomCode)).ReturnsAsync(new Room());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateRoomAsync(dto));
        Assert.Contains("already exists", ex.Message);
    }

    // UTC_RM_02: Create room with unique code succeeds
    [Fact]
    public async Task CreateRoomAsync_UniqueCode_CreatesRoom()
    {
        var dto = new CreateRoomDto { RoomCode = "BE-202", RoomName = "Lab Beta 202", Capacity = 30 };
        _uowMock.Setup(u => u.Rooms.GetByRoomCodeAsync(dto.RoomCode)).ReturnsAsync((Room)null!);
        _uowMock.Setup(u => u.Rooms.AddAsync(It.IsAny<Room>())).Returns(Task.CompletedTask);

        await _service.CreateRoomAsync(dto);

        _uowMock.Verify(u => u.Rooms.AddAsync(It.IsAny<Room>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_RM_03: Update room with duplicate code throws exception
    [Fact]
    public async Task UpdateRoomAsync_DuplicateCode_ThrowsException()
    {
        var id = Guid.NewGuid();
        var existingRoomId = Guid.NewGuid();
        var dto = new UpdateRoomDto { RoomCode = "A101", RoomName = "Lab A Updated" };

        _uowMock.Setup(u => u.Rooms.GetByIdAsync(id)).ReturnsAsync(new Room { Id = id });
        _uowMock.Setup(u => u.Rooms.GetByRoomCodeAsync(dto.RoomCode)).ReturnsAsync(new Room { Id = existingRoomId });

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateRoomAsync(id, dto));
        Assert.Contains("already exists", ex.Message);
    }

    // UTC_RM_04: Update room with same code as itself succeeds
    [Fact]
    public async Task UpdateRoomAsync_SameCode_SameRoom_Succeeds()
    {
        var id = Guid.NewGuid();
        var room = new Room { Id = id, RoomCode = "A101", RoomName = "Lab A", Capacity = 30 };
        var dto = new UpdateRoomDto { RoomCode = "A101", RoomName = "Lab A Updated", Capacity = 35 };

        _uowMock.Setup(u => u.Rooms.GetByIdAsync(id)).ReturnsAsync(room);
        _uowMock.Setup(u => u.Rooms.GetByRoomCodeAsync(dto.RoomCode)).ReturnsAsync(room); // same room

        await _service.UpdateRoomAsync(id, dto);

        _uowMock.Verify(u => u.Rooms.Update(It.IsAny<Room>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_RM_05: Delete room that does not exist returns false
    [Fact]
    public async Task DeleteRoomAsync_NotFound_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(id)).ReturnsAsync((Room)null!);

        var result = await _service.DeleteRoomAsync(id);

        Assert.False(result);
    }

    // UTC_RM_06: Get room by ID that does not exist returns null
    [Fact]
    public async Task GetRoomByIdAsync_NotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Rooms.GetAll()).Returns(new List<Room>().BuildMockDbSet());

        var result = await _service.GetRoomByIdAsync(id);

        Assert.Null(result);
    }
}
