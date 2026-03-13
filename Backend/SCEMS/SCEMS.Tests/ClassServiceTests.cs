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
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
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
    public async Task GetClassesByLecturerAsync_ReturnsMappedDtos()
    {
        // Arrange
        var lecturerId = Guid.NewGuid();
        var classes = new List<Class> 
        { 
            new Class { Id = Guid.NewGuid(), ClassCode = "C1", LecturerId = lecturerId } 
        };
        var dtos = new List<ClassResponseDto> 
        { 
            new ClassResponseDto { Id = classes[0].Id, ClassCode = "C1" } 
        };

        _uowMock.Setup(u => u.Classes.GetAll()).Returns(classes.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<List<ClassResponseDto>>(classes)).Returns(dtos);

        // Act
        var result = await _service.GetClassesByLecturerAsync(lecturerId);

        // Assert
        Assert.Single(result);
        Assert.Equal("C1", result[0].ClassCode);
    }

    [Fact]
    public async Task GetAllClassesAsync_ReturnsAllMappedDtos()
    {
        // Arrange
        var classes = new List<Class> 
        { 
            new Class { Id = Guid.NewGuid(), ClassCode = "C1" },
            new Class { Id = Guid.NewGuid(), ClassCode = "C2" }
        };
        var dtos = new List<ClassResponseDto> 
        { 
            new ClassResponseDto { Id = classes[0].Id, ClassCode = "C1" },
            new ClassResponseDto { Id = classes[1].Id, ClassCode = "C2" }
        };

        _uowMock.Setup(u => u.Classes.GetAll()).Returns(classes.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<List<ClassResponseDto>>(classes)).Returns(dtos);

        // Act
        var result = await _service.GetAllClassesAsync();

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetClassStudentsAsync_WithPendingStudent_MapsCorrectly()
    {
        // Arrange
        var classId = Guid.NewGuid();
        var enrollments = new List<ClassStudent>
        {
            new ClassStudent 
            { 
                ClassId = classId, 
                StudentId = Guid.NewGuid(),
                Student = new Account { Id = Guid.NewGuid(), FullName = "Test Student", Email = "test@edu.vn" }
            },
            new ClassStudent 
            { 
                ClassId = classId, 
                StudentId = null,
                PendingStudentIdentifier = "pending@edu.vn"
            }
        };

        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(enrollments.BuildMockDbSet());

        // Act
        var result = await _service.GetClassStudentsAsync(classId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.FullName == "Test Student");
        Assert.Contains(result, r => r.FullName == "Pending Registration" && r.Email == "pending@edu.vn");
    }

    [Fact]
    public async Task LinkPendingEnrollmentsAsync_NoPending_DoesNotCallUpdate()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(new List<ClassStudent>().BuildMockDbSet());

        // Act
        await _service.LinkPendingEnrollmentsAsync(studentId, "test@scems.com", "S123");

        // Assert
        _uowMock.Verify(u => u.ClassStudents.Update(It.IsAny<ClassStudent>()), Times.Never);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task LinkPendingEnrollmentsAsync_WithPending_CallsUpdate()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var enrollments = new List<ClassStudent>
        {
            new ClassStudent { StudentId = null, PendingStudentIdentifier = "test@scems.com" }
        };
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(enrollments.BuildMockDbSet());

        // Act
        await _service.LinkPendingEnrollmentsAsync(studentId, "test@scems.com", "S123");

        // Assert
        _uowMock.Verify(u => u.ClassStudents.Update(It.IsAny<ClassStudent>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}
