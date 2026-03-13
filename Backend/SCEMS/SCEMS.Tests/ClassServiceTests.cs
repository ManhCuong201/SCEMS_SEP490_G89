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

    // UTC_CS_01: GetClassByIdAsync returns null for non-existent class
    [Fact]
    public async Task GetClassByIdAsync_NotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Classes.GetByIdAsync(id)).ReturnsAsync((Class)null!);

        var result = await _service.GetClassByIdAsync(id);

        Assert.Null(result);
    }

    // UTC_CS_02: GetClassesByLecturerAsync returns mapped DTOs for lecturer
    [Fact]
    public async Task GetClassesByLecturerAsync_ReturnsMappedDtos()
    {
        var lecturerId = Guid.NewGuid();
        var classes = new List<Class> { new Class { Id = Guid.NewGuid(), ClassCode = "C1", LecturerId = lecturerId } };
        var dtos = new List<ClassResponseDto> { new ClassResponseDto { Id = classes[0].Id, ClassCode = "C1" } };

        _uowMock.Setup(u => u.Classes.GetAll()).Returns(classes.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<List<ClassResponseDto>>(classes)).Returns(dtos);

        var result = await _service.GetClassesByLecturerAsync(lecturerId);

        Assert.Single(result);
        Assert.Equal("C1", result[0].ClassCode);
    }

    // UTC_CS_03: GetAllClassesAsync with no filter returns all classes
    [Fact]
    public async Task GetAllClassesAsync_ReturnsAllMappedDtos()
    {
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

        var result = await _service.GetAllClassesAsync();

        Assert.Equal(2, result.Count);
    }

    // UTC_CS_04: GetClassStudentsAsync maps both linked and pending students
    [Fact]
    public async Task GetClassStudentsAsync_MapsLinkedAndPending()
    {
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

        var result = await _service.GetClassStudentsAsync(classId);

        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.FullName == "Test Student");
        Assert.Contains(result, r => r.FullName == "Pending Registration" && r.Email == "pending@edu.vn");
    }

    // UTC_CS_05: GetClassStudentsAsync with no students returns empty
    [Fact]
    public async Task GetClassStudentsAsync_NoStudents_ReturnsEmpty()
    {
        var classId = Guid.NewGuid();
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(new List<ClassStudent>().BuildMockDbSet());

        var result = await _service.GetClassStudentsAsync(classId);

        Assert.Empty(result);
    }

    // UTC_CS_06: LinkPendingEnrollmentsAsync with no pending does not update
    [Fact]
    public async Task LinkPendingEnrollmentsAsync_NoPending_DoesNotCallUpdate()
    {
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(new List<ClassStudent>().BuildMockDbSet());

        await _service.LinkPendingEnrollmentsAsync(Guid.NewGuid(), "test@scems.com", "S123");

        _uowMock.Verify(u => u.ClassStudents.Update(It.IsAny<ClassStudent>()), Times.Never);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    // UTC_CS_07: LinkPendingEnrollmentsAsync with matching pending calls Update
    [Fact]
    public async Task LinkPendingEnrollmentsAsync_WithPending_CallsUpdate()
    {
        var studentId = Guid.NewGuid();
        var enrollments = new List<ClassStudent>
        {
            new ClassStudent { StudentId = null, PendingStudentIdentifier = "test@scems.com" }
        };
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(enrollments.BuildMockDbSet());

        await _service.LinkPendingEnrollmentsAsync(studentId, "test@scems.com", "S123");

        _uowMock.Verify(u => u.ClassStudents.Update(It.IsAny<ClassStudent>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.AtLeastOnce);
    }

    // UTC_CS_08: LinkPendingEnrollmentsAsync only links by matching email identifier
    [Fact]
    public async Task LinkPendingEnrollmentsAsync_NonMatchingEmail_DoesNotUpdate()
    {
        var studentId = Guid.NewGuid();
        var enrollments = new List<ClassStudent>
        {
            new ClassStudent { StudentId = null, PendingStudentIdentifier = "different@edu.vn" }
        };
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(enrollments.BuildMockDbSet());

        await _service.LinkPendingEnrollmentsAsync(studentId, "test@scems.com", "S123");

        _uowMock.Verify(u => u.ClassStudents.Update(It.IsAny<ClassStudent>()), Times.Never);
    }
}
