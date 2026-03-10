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
        _uowMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _service = new RoomService(_uowMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task CreateRoomAsync_DuplicateCode_ThrowsException()
    {
        // Arrange
        var dto = new CreateRoomDto { RoomCode = "A101", RoomName = "Lab A" };
        _uowMock.Setup(u => u.Rooms.GetByRoomCodeAsync(dto.RoomCode)).ReturnsAsync(new Room());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateRoomAsync(dto));
        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task UpdateRoomAsync_DuplicateCode_ThrowsException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var existingRoomId = Guid.NewGuid();
        var dto = new UpdateRoomDto { RoomCode = "A101", RoomName = "Lab A Updated" };
        
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(id)).ReturnsAsync(new Room { Id = id });
        _uowMock.Setup(u => u.Rooms.GetByRoomCodeAsync(dto.RoomCode)).ReturnsAsync(new Room { Id = existingRoomId });

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateRoomAsync(id, dto));
        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task DeleteRoomAsync_NotFound_ReturnsFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Rooms.GetByIdAsync(id)).ReturnsAsync((Room)null);

        // Act
        var result = await _service.DeleteRoomAsync(id);

        // Assert
        Assert.False(result);
    }
}
