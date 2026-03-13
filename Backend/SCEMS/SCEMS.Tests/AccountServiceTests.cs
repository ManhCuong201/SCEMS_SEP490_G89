using Moq;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Account;
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

public class AccountServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IClassService> _classServiceMock;
    private readonly AccountService _service;

    public AccountServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _mapperMock = new Mock<IMapper>();
        _classServiceMock = new Mock<IClassService>();
        _service = new AccountService(_uowMock.Object, _mapperMock.Object, _classServiceMock.Object);
    }

    [Fact]
    public async Task CreateAccountAsync_DuplicateEmail_ThrowsException()
    {
        // Arrange
        var dto = new CreateAccountDto { Email = "test@scems.com", FullName = "Test User", Password = "password123" };
        _uowMock.Setup(u => u.Accounts.GetByEmailAsync(dto.Email)).ReturnsAsync(new Account());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAccountAsync(dto));
        Assert.Contains("already exists", ex.Message);
    }

    [Fact]
    public async Task UpdateAccount_SystemAdmin_ThrowsException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var account = new Account { Id = id, Email = "admin@scems.com" };
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync(account);
        var dto = new UpdateAccountDto { Email = "new@scems.com" };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateAccountAsync(id, dto));
        Assert.Contains("Cannot modify system account", ex.Message);
    }

    [Fact]
    public async Task DeleteAccount_SystemAdmin_ThrowsException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var account = new Account { Id = id, Email = "admin@scems.com" };
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync(account);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.DeleteAccountAsync(id));
        Assert.Contains("Cannot delete system account", ex.Message);
    }
}
