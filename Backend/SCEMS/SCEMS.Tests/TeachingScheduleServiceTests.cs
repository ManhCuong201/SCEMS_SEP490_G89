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
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
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

    [Fact]
    public async Task GetMyScheduleAsync_LecturerRole_ReturnsAssignedSchedules()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var account = new Account { Id = userId, Role = AccountRole.Lecturer, FullName = "Dr. Test" };
        var date = DateTime.Today;
        var schedules = new List<Teaching_Schedule>
        {
            new Teaching_Schedule { Id = Guid.NewGuid(), LecturerId = userId.ToString(), Date = date },
            new Teaching_Schedule { Id = Guid.NewGuid(), LecturerName = "Dr. Test", Date = date.AddDays(1) }
        };
        var dtos = new List<ScheduleResponseDto>
        {
            new ScheduleResponseDto { Id = schedules[0].Id },
            new ScheduleResponseDto { Id = schedules[1].Id }
        };

        _uowMock.Setup(u => u.Accounts.GetByIdAsync(userId)).ReturnsAsync(account);
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(schedules.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<List<ScheduleResponseDto>>(It.IsAny<List<Teaching_Schedule>>())).Returns(dtos);

        // Act
        var result = await _service.GetMyScheduleAsync(userId, date, date.AddDays(7));

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetMyScheduleAsync_StudentRole_AutoResolvesClasses()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var account = new Account { Id = userId, Role = AccountRole.Student, FullName = "Student A" };
        var classId = Guid.NewGuid();
        var date = DateTime.Today;

        var enrollments = new List<ClassStudent>
        {
            new ClassStudent { StudentId = userId, Class = new Class { ClassCode = "SE16" } }
        };
        var schedules = new List<Teaching_Schedule>
        {
            new Teaching_Schedule { Id = Guid.NewGuid(), ClassCode = "SE16", Date = date }
        };
        var dtos = new List<ScheduleResponseDto>
        {
            new ScheduleResponseDto { Id = schedules[0].Id }
        };

        _uowMock.Setup(u => u.Accounts.GetByIdAsync(userId)).ReturnsAsync(account);
        _uowMock.Setup(u => u.ClassStudents.GetAll()).Returns(enrollments.BuildMockDbSet());
        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(schedules.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<List<ScheduleResponseDto>>(It.IsAny<List<Teaching_Schedule>>())).Returns(dtos);

        // Act
        var result = await _service.GetMyScheduleAsync(userId, date, date.AddDays(7));

        // Assert
        Assert.Single(result);
    }

    [Fact]
    public async Task GetAllSchedulesAsync_ReturnsMappedDtos()
    {
        // Arrange
        var date = DateTime.Today;
        var schedules = new List<Teaching_Schedule>
        {
            new Teaching_Schedule { Id = Guid.NewGuid(), Date = date },
            new Teaching_Schedule { Id = Guid.NewGuid(), Date = date.AddDays(2) }
        };
        var dtos = new List<ScheduleResponseDto>
        {
            new ScheduleResponseDto { Id = schedules[0].Id },
            new ScheduleResponseDto { Id = schedules[1].Id }
        };

        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(schedules.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<List<ScheduleResponseDto>>(It.IsAny<List<Teaching_Schedule>>())).Returns(dtos);

        // Act
        var result = await _service.GetAllSchedulesAsync(date, date.AddDays(7));

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetSchedulesByDateAsync_ReturnsMatchedSchedules()
    {
        // Arrange
        var date = DateTime.Today;
        var schedules = new List<Teaching_Schedule>
        {
            new Teaching_Schedule { Id = Guid.NewGuid(), Date = date }
        };
        var dtos = new List<ScheduleResponseDto>
        {
            new ScheduleResponseDto { Id = schedules[0].Id }
        };

        _uowMock.Setup(u => u.TeachingSchedules.GetAll()).Returns(schedules.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<List<ScheduleResponseDto>>(It.IsAny<List<Teaching_Schedule>>())).Returns(dtos);

        // Act
        var result = await _service.GetSchedulesByDateAsync(date);

        // Assert
        Assert.Single(result);
    }
}
