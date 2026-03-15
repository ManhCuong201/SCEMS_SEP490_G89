using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;

namespace SCEMS.Infrastructure.Data;

public class MockDataSeeder
{
    private class MockDataFormat
    {
        public List<Account> Accounts { get; set; } = new();
        public List<Class> Classes { get; set; } = new();
        public List<ClassStudent> ClassStudents { get; set; } = new();
        public List<Teaching_Schedule> TeachingSchedules { get; set; } = new();
        public List<IssueReport> IssueReports { get; set; } = new();
        public List<Notification> Notifications { get; set; } = new();
        public List<Booking> Bookings { get; set; } = new();
    }

    public static async Task SeedAsync(ScemsDbContext context, string basePath)
    {
        try
        {
            var filePath = Path.Combine(basePath, "SCEMS.Infrastructure", "Data", "SeedData", "mock_system_data.json");

            if (!File.Exists(filePath))
                filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "SeedData", "mock_system_data.json");

            if (!File.Exists(filePath))
            {
                Console.WriteLine($"Mock data file not found at {filePath}");
                return;
            }

            Console.WriteLine("Reading mock_system_data.json to seed large dataset...");
            var jsonContent = await File.ReadAllTextAsync(filePath);

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            options.Converters.Add(new JsonStringEnumConverter()); // Cho phép Map string "Student" vào AccountRole.Student

            var seedData = JsonSerializer.Deserialize<MockDataFormat>(jsonContent, options);

            if (seedData != null)
            {
                // 1. Thêm Accounts
                if (seedData.Accounts.Any() && !await context.Accounts.AnyAsync(a => a.Email == "student1@fpt.edu.vn"))
                {
                    await context.Accounts.AddRangeAsync(seedData.Accounts);
                    await context.SaveChangesAsync();
                }

                // 2. Thêm Classes & Students
                if (seedData.Classes.Any() && !await context.Classes.AnyAsync(c => c.ClassCode == "SE1701"))
                {
                    await context.Classes.AddRangeAsync(seedData.Classes);
                    await context.SaveChangesAsync();
                }
                if (seedData.ClassStudents.Any() && !await context.ClassStudents.AnyAsync())
                {
                    await context.ClassStudents.AddRangeAsync(seedData.ClassStudents);
                    await context.SaveChangesAsync();
                }

                // Lấy ra 1 phòng và 1 thiết bị đầu tiên để gán tự động (tránh lỗi khóa ngoại)
                var firstRoom = await context.Rooms.FirstOrDefaultAsync();
                var firstEquip = await context.Equipment.FirstOrDefaultAsync();

                // 3. Thêm Lịch học
                if (seedData.TeachingSchedules.Any() && !await context.TeachingSchedules.AnyAsync() && firstRoom != null)
                {
                    foreach (var s in seedData.TeachingSchedules) s.RoomId = firstRoom.Id;
                    await context.TeachingSchedules.AddRangeAsync(seedData.TeachingSchedules);
                    await context.SaveChangesAsync();
                }

                // 4. Thêm Report & Noti & Booking
                if (seedData.IssueReports.Any() && !await context.IssueReports.AnyAsync() && firstRoom != null)
                {
                    foreach (var i in seedData.IssueReports) { i.RoomId = firstRoom.Id; i.EquipmentId = firstEquip?.Id; }
                    await context.IssueReports.AddRangeAsync(seedData.IssueReports);
                    await context.SaveChangesAsync();
                }
                if (seedData.Notifications.Any() && !await context.Notifications.AnyAsync())
                {
                    await context.Notifications.AddRangeAsync(seedData.Notifications);
                    await context.SaveChangesAsync();
                }
                if (seedData.Bookings.Any() && !await context.Bookings.AnyAsync() && firstRoom != null)
                {
                    foreach (var b in seedData.Bookings) b.RoomId = firstRoom.Id;
                    await context.Bookings.AddRangeAsync(seedData.Bookings);
                    await context.SaveChangesAsync();
                }

                Console.WriteLine("Mock system data seeded successfully.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred while seeding Mock Data: {ex.Message}");
            throw;
        }
    }
}