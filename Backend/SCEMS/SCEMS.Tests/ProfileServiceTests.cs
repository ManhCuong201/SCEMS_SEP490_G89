using Moq;
using SCEMS.Application.Common.Interfaces;
using SCEMS.Application.DTOs.Profile;
using SCEMS.Application.Services;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using Microsoft.EntityFrameworkCore;
using System;

namespace SCEMS.Tests;

public class ProfileServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly Mock<IPasswordHasher> _hasherMock;
    private readonly ProfileService _service;

    public ProfileServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _hasherMock = new Mock<IPasswordHasher>();
        _service = new ProfileService(_uowMock.Object, _hasherMock.Object);
    }

    [Fact]
    public async Task GetProfileAsync_ExistingUser_ReturnsProfile()
    {
        var id = Guid.NewGuid();
        var account = new Account { Id = id, FullName = "User", Email = "u@e.com" };
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync(account);

        var result = await _service.GetProfileAsync(id);

        Assert.NotNull(result);
        Assert.Equal(id, result.Id);
    }

    [Fact]
    public async Task GetProfileAsync_NonExistingUser_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync((Account)null);

        var result = await _service.GetProfileAsync(id);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateProfileAsync_ExistingUser_UpdatesAndReturns()
    {
        var id = Guid.NewGuid();
        var account = new Account { Id = id, FullName = "Old" };
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync(account);
        var dto = new UpdateProfileDto { FullName = "New", Phone = "123" };

        var result = await _service.UpdateProfileAsync(id, dto);

        Assert.Equal("New", account.FullName);
        _uowMock.Verify(u => u.Accounts.Update(account), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_ValidCurrent_UpdatesHash()
    {
        var id = Guid.NewGuid();
        var account = new Account { Id = id, PasswordHash = "OldHash" };
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync(account);
        _hasherMock.Setup(h => h.VerifyPassword("Old", "OldHash")).Returns(true);
        _hasherMock.Setup(h => h.HashPassword("New")).Returns("NewHash");

        var result = await _service.ChangePasswordAsync(id, new ChangePasswordDto { CurrentPassword = "Old", NewPassword = "New" });

        Assert.True(result);
        Assert.Equal("NewHash", account.PasswordHash);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_InvalidCurrent_ReturnsFalse()
    {
        var id = Guid.NewGuid();
        var account = new Account { Id = id, PasswordHash = "OldHash" };
        _uowMock.Setup(u => u.Accounts.GetByIdAsync(id)).ReturnsAsync(account);
        _hasherMock.Setup(h => h.VerifyPassword("Wrong", "OldHash")).Returns(false);

        var result = await _service.ChangePasswordAsync(id, new ChangePasswordDto { CurrentPassword = "Wrong", NewPassword = "New" });

        Assert.False(result);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }
}
