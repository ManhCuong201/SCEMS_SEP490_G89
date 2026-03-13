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

    // UTC_AC_01: Create account with duplicate email throws exception
    [Fact]
    public async Task CreateAccountAsync_DuplicateEmail_ThrowsException()
    {
        var dto = new CreateAccountDto { Email = "test@scems.com", FullName = "Test User", Password = "password123" };
        _uowMock.Setup(u => u.Accounts.GetByEmailAsync(dto.Email)).ReturnsAsync(new Account());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAccountAsync(dto));
        Assert.Contains("already exists", ex.Message);
    }

    // UTC_AC_02: Create account with new email succeeds
    [Fact]
    public async Task CreateAccountAsync_NewEmail_CreatesAccount()
    {
        var dto = new CreateAccountDto { Email = "new@scems.com", FullName = "New User", Password = "Pass!123" };
        _uowMock.Setup(u => u.Accounts.GetByEmailAsync(dto.Email)).ReturnsAsync((Account)null!);
        _uowMock.Setup(u => u.Accounts.AddAsync(It.IsAny<Account>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map<AccountResponseDto>(It.IsAny<Account>())).Returns(new AccountResponseDto { Email = dto.Email });

        var result = await _service.CreateAccountAsync(dto);

        _uowMock.Verify(u => u.Accounts.AddAsync(It.IsAny<Account>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // UTC_AC_03: Update system admin account throws exception
    [Fact]
    public async Task UpdateAccount_SystemAdmin_ThrowsException()
    {
        var adminId = Guid.Parse("d117a9bb-35c0-4d65-84c3-6d7347ba3c00"); // System Administrator
        var account = new Account { Id = adminId, Email = "admin@scems.com", FullName = "System Administrator" };
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(adminId)).ReturnsAsync(account);
        var dto = new UpdateAccountDto { Email = "new@scems.com" };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateAccountAsync(adminId, dto));
        Assert.Contains("Cannot modify system account", ex.Message);
    }

    // UTC_AC_04: Delete system admin account throws exception
    [Fact]
    public async Task DeleteAccount_SystemAdmin_ThrowsException()
    {
        var adminId = Guid.Parse("d117a9bb-35c0-4d65-84c3-6d7347ba3c00");
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(adminId)).ReturnsAsync(new Account { Id = adminId, Email = "admin@scems.com" });

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.DeleteAccountAsync(adminId));
        Assert.Contains("Cannot delete system account", ex.Message);
    }

    // UTC_AC_05: Delete non-existent account returns false
    [Fact]
    public async Task DeleteAccount_NotFound_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync((Account)null!);

        var result = await _service.DeleteAccountAsync(id);

        Assert.False(result);
    }

    // UTC_AC_06: GetAccountByIdAsync returns null if not found
    [Fact]
    public async Task GetAccountByIdAsync_NotFound_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Accounts.GetAll()).Returns(new List<Account>().BuildMockDbSet());

        var result = await _service.GetAccountByIdAsync(id);

        Assert.Null(result);
    }
}
