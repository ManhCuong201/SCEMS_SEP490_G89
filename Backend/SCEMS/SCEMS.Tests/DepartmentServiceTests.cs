using Moq;
using SCEMS.Application.DTOs.Department;
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

public class DepartmentServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly DepartmentService _service;

    public DepartmentServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _service = new DepartmentService(_uowMock.Object, _mapperMock.Object);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllDepartments()
    {
        var departments = new List<Department> { new Department { Id = Guid.NewGuid() } };
        _uowMock.Setup(u => u.Departments.GetAll()).Returns(departments.BuildMockDbSet());
        _mapperMock.Setup(m => m.Map<IEnumerable<DepartmentDto>>(It.IsAny<IEnumerable<Department>>()))
            .Returns(new List<DepartmentDto> { new DepartmentDto() });

        var result = await _service.GetAllAsync();

        Assert.Single(result);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsDepartment()
    {
        var id = Guid.NewGuid();
        var department = new Department { Id = id };
        _uowMock.Setup(u => u.Departments.GetByIdAsync(id)).ReturnsAsync(department);
        _mapperMock.Setup(m => m.Map<DepartmentDto>(department)).Returns(new DepartmentDto { Id = id });

        var result = await _service.GetByIdAsync(id);

        Assert.NotNull(result);
        Assert.Equal(id, result.Id);
    }

    [Fact]
    public async Task CreateAsync_CallsAddAndSave()
    {
        var dto = new CreateDepartmentDto { DepartmentName = "IT" };
        var department = new Department { DepartmentName = "IT" };
        _mapperMock.Setup(m => m.Map<Department>(dto)).Returns(department);

        await _service.CreateAsync(dto);

        _uowMock.Verify(u => u.Departments.AddAsync(department), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ExistingId_ReturnsTrue()
    {
        var id = Guid.NewGuid();
        var department = new Department { Id = id };
        var dto = new UpdateDepartmentDto { DepartmentName = "CS" };
        _uowMock.Setup(u => u.Departments.GetByIdAsync(id)).ReturnsAsync(department);

        var result = await _service.UpdateAsync(id, dto);

        Assert.True(result);
        _uowMock.Verify(u => u.Departments.Update(department), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingId_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Departments.GetByIdAsync(id)).ReturnsAsync((Department)null);

        var result = await _service.UpdateAsync(id, new UpdateDepartmentDto());

        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_ExistingId_ReturnsTrueAndSetsIsDeleted()
    {
        var id = Guid.NewGuid();
        var department = new Department { Id = id, IsDeleted = false };
        _uowMock.Setup(u => u.Departments.GetByIdAsync(id)).ReturnsAsync(department);

        var result = await _service.DeleteAsync(id);

        Assert.True(result);
        Assert.True(department.IsDeleted);
        _uowMock.Verify(u => u.Departments.Update(department), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}
