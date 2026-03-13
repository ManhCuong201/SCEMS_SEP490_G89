using Moq;
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

public class ConfigurationServiceTests
{
    private readonly Mock<IUnitOfWork> _uowMock;
    private readonly ConfigurationService _service;

    public ConfigurationServiceTests()
    {
        _uowMock = new Mock<IUnitOfWork> { DefaultValue = DefaultValue.Mock };
        _service = new ConfigurationService(_uowMock.Object);
    }

    [Fact]
    public async Task GetAllSettingsAsync_ReturnsAllSettings()
    {
        var settings = new List<System_Configuration>
        {
            new System_Configuration { Key = "K1", Value = "V1" },
            new System_Configuration { Key = "K2", Value = "V2" }
        }.BuildMockDbSet();

        _uowMock.Setup(u => u.SystemConfigurations.GetAll()).Returns(settings);

        var result = await _service.GetAllSettingsAsync();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetValueAsync_ExistingKey_ReturnsValue()
    {
        var settings = new List<System_Configuration>
        {
            new System_Configuration { Key = "K1", Value = "V1" }
        }.BuildMockDbSet();

        _uowMock.Setup(u => u.SystemConfigurations.GetAll()).Returns(settings);

        var result = await _service.GetValueAsync("K1", "Default");

        Assert.Equal("V1", result);
    }

    [Fact]
    public async Task GetValueAsync_NonExistingKey_ReturnsDefault()
    {
        _uowMock.Setup(u => u.SystemConfigurations.GetAll()).Returns(new List<System_Configuration>().BuildMockDbSet());

        var result = await _service.GetValueAsync("K1", "Default");

        Assert.Equal("Default", result);
    }

    [Fact]
    public async Task GetValueAsyncTyped_ExistingInt_ReturnsInt()
    {
        var settings = new List<System_Configuration>
        {
            new System_Configuration { Key = "K1", Value = "100" }
        }.BuildMockDbSet();

        _uowMock.Setup(u => u.SystemConfigurations.GetAll()).Returns(settings);

        var result = await _service.GetValueAsync<int>("K1", 0);

        Assert.Equal(100, result);
    }

    [Fact]
    public async Task GetValueAsyncTyped_InvalidInt_ReturnsDefault()
    {
        var settings = new List<System_Configuration>
        {
            new System_Configuration { Key = "K1", Value = "NotAnInt" }
        }.BuildMockDbSet();

        _uowMock.Setup(u => u.SystemConfigurations.GetAll()).Returns(settings);

        var result = await _service.GetValueAsync<int>("K1", 50);

        Assert.Equal(50, result);
    }

    [Fact]
    public async Task UpdateSettingAsync_NewSetting_CallsAdd()
    {
        _uowMock.Setup(u => u.SystemConfigurations.GetAll()).Returns(new List<System_Configuration>().BuildMockDbSet());

        await _service.UpdateSettingAsync("NewKey", "NewVal", "Desc");

        _uowMock.Verify(u => u.SystemConfigurations.AddAsync(It.IsAny<System_Configuration>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateSettingAsync_ExistingSetting_CallsUpdate()
    {
        var existing = new System_Configuration { Key = "K1", Value = "Old" };
        var settings = new List<System_Configuration> { existing }.BuildMockDbSet();

        _uowMock.Setup(u => u.SystemConfigurations.GetAll()).Returns(settings);

        await _service.UpdateSettingAsync("K1", "New");

        Assert.Equal("New", existing.Value);
        _uowMock.Verify(u => u.SystemConfigurations.Update(existing), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }
}
