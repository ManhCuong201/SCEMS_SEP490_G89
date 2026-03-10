using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Class;
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

public class ClassServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly ClassService _service;

    public ClassServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _service = new ClassService(_uowMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task GetClassByIdAsync_NotFound_ReturnsNull()
    {
        // Arrange
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Classes.GetByIdAsync(id)).ReturnsAsync((Class)null);

        // Act
        var result = await _service.GetClassByIdAsync(id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task LinkPendingEnrollmentsAsync_NoPending_DoesNotCallUpdate()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(new List<ClassStudent>().AsQueryable());

        // Act
        await _service.LinkPendingEnrollmentsAsync(studentId, "test@scems.com", "S123");

        // Assert
        _uowMock.Verify(u => u.ClassStudents.Update(It.IsAny<ClassStudent>()), Times.Never);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }
}
