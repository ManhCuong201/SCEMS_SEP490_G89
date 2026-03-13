using SCEMS.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SCEMS.Application.Services.Interfaces;

public interface IConfigurationService
{
    Task<List<System_Configuration>> GetAllSettingsAsync();
    Task<System_Configuration?> GetSettingAsync(string key);
    Task<string> GetValueAsync(string key, string defaultValue = "");
    Task<T> GetValueAsync<T>(string key, T defaultValue);
    Task UpdateSettingAsync(string key, string value, string? description = null);
    Task InitializeDefaultSettingsAsync();
}
