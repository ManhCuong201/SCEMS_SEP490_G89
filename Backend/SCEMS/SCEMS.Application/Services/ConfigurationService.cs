using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.ComponentModel;
using System;

namespace SCEMS.Application.Services;

public class ConfigurationService : IConfigurationService
{
    private readonly IUnitOfWork _unitOfWork;

    public ConfigurationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<System_Configuration>> GetAllSettingsAsync()
    {
        return await _unitOfWork.SystemConfigurations.GetAll().ToListAsync();
    }

    public async Task<System_Configuration?> GetSettingAsync(string key)
    {
        return await _unitOfWork.SystemConfigurations.GetAll()
            .FirstOrDefaultAsync(c => c.Key == key);
    }

    public async Task<string> GetValueAsync(string key, string defaultValue = "")
    {
        var setting = await GetSettingAsync(key);
        return setting?.Value ?? defaultValue;
    }

    public async Task<T> GetValueAsync<T>(string key, T defaultValue)
    {
        var value = await GetValueAsync(key);
        if (string.IsNullOrEmpty(value)) return defaultValue;

        try
        {
            var converter = TypeDescriptor.GetConverter(typeof(T));
            return (T)converter.ConvertFromString(value)!;
        }
        catch
        {
            return defaultValue;
        }
    }

    public async Task UpdateSettingAsync(string key, string value, string? description = null)
    {
        var setting = await GetSettingAsync(key);
        if (setting == null)
        {
            setting = new System_Configuration
            {
                Key = key,
                Value = value,
                Description = description ?? string.Empty
            };
            await _unitOfWork.SystemConfigurations.AddAsync(setting);
        }
        else
        {
            setting.Value = value;
            if (description != null) setting.Description = description;
            _unitOfWork.SystemConfigurations.Update(setting);
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task InitializeDefaultSettingsAsync()
    {
        var defaults = new List<(string Key, string Value, string Description)>
        {
            // Booking Rules
            ("Booking.MaxPerWeek", "5", "Số lần mượn phòng tối đa của một người dùng trong một tuần"),
            ("Booking.AutoApproveEnabled", "true", "Bật/Tắt tự động phê duyệt yêu cầu"),
            ("Booking.AutoApproveRules", "[{\"Role\":\"Lecturer\",\"RoomType\":\"Phòng học lý thuyết\"}]", "Danh sách quy tắc phê duyệt tự động"),
            
            // Classroom Settings
            ("Classroom.AutoLock", "false", "Tự động khóa phòng sau khi kết thúc sử dụng"),
            ("Classroom.DefaultStatus", "Available", "Trạng thái mặc định của phòng học khi khởi tạo"),

            // Equipment Mgmt Rules
            ("Equipment.MaintenanceIntervalDays", "90", "Khoảng cách giữa các lần bảo trì thiết bị định kỳ (ngày)"),

            // Notification Settings
            ("Notification.EmailEnabled", "true", "Bật/Tắt gửi thông báo qua Email"),
            ("Notification.PushEnabled", "true", "Bật/Tắt gửi thông báo Push"),

            // Security Policies
            ("Security.MaxLoginAttempts", "5", "Số lần đăng nhập sai tối đa trước khi khóa tài khoản"),
            ("Security.SessionTimeoutMinutes", "60", "Thời gian hết hạn phiên làm việc (phút)"),
            ("Security.PasswordMinLength", "8", "Độ dài tối thiểu của mật khẩu")
        };

        foreach (var (key, val, desc) in defaults)
        {
            var existing = await GetSettingAsync(key);
            if (existing == null)
            {
                await _unitOfWork.SystemConfigurations.AddAsync(new System_Configuration
                {
                    Key = key,
                    Value = val,
                    Description = desc
                });
            }
        }

        // Cleanup Obsolete Keys
        var obsoleteKeys = new[] { 
            "Booking.StartHour", "Booking.EndHour", "Booking.SlotDurationMinutes", "Booking.MaxDurationHours",
            "Booking.AutoApproveRoles", "Booking.AutoApproveRoomTypes"
        };
        var obsoleteSettings = await _unitOfWork.SystemConfigurations.GetAll()
            .Where(s => obsoleteKeys.Contains(s.Key))
            .ToListAsync();
            
        foreach (var obsolete in obsoleteSettings)
        {
            _unitOfWork.SystemConfigurations.Delete(obsolete);
        }

        await _unitOfWork.SaveChangesAsync();
    }
}
