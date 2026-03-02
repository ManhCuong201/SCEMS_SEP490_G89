using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.DbContext;

namespace SCEMS.Infrastructure.Data;

public class FptDataSeeder
{
    private class SeedDataFormat
    {
        public List<RoomType> roomTypes { get; set; } = new();
        public List<Department> departments { get; set; } = new();
        public List<Room> rooms { get; set; } = new();
        public List<EquipmentType> equipmentTypes { get; set; } = new();
        public List<Equipment> equipments { get; set; } = new();
    }

    public static async Task SeedAsync(ScemsDbContext context, string basePath, Func<string, string> hashPassword)
    {
        try
        {
            // Fast-path: if database already contains data, assume seeding is complete to save startup time
            if (await context.Rooms.AnyAsync())
            {
                return;
            }
            var filePath = Path.Combine(basePath, "SCEMS.Infrastructure", "Data", "SeedData", "fpt_campus_data.json");
            
            if (!File.Exists(filePath))
            {
                // Try alternate path if running from API vs Infrastructure directly
                filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "SeedData", "fpt_campus_data.json");
            }
            
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"Seed data file not found at {filePath}. Skipping specific FPT data seed.");
                return;
            }

            Console.WriteLine("Reading fpt_campus_data.json for database seeding...");
            var jsonContent = await File.ReadAllTextAsync(filePath);
            
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            var seedData = JsonSerializer.Deserialize<SeedDataFormat>(jsonContent, options);

            if (seedData != null)
            {
                if (seedData.roomTypes.Any() && !await context.RoomTypes.AnyAsync())
                {
                    await context.RoomTypes.AddRangeAsync(seedData.roomTypes);
                    Console.WriteLine($"Seeding {seedData.roomTypes.Count} Room Types...");
                    await context.SaveChangesAsync();
                }

                if (seedData.departments.Any() && !await context.Departments.AnyAsync())
                {
                    await context.Departments.AddRangeAsync(seedData.departments);
                    Console.WriteLine($"Seeding {seedData.departments.Count} Departments...");
                    await context.SaveChangesAsync();
                }

                if (seedData.rooms.Any() && !await context.Rooms.AnyAsync())
                {
                    await context.Rooms.AddRangeAsync(seedData.rooms);
                    Console.WriteLine($"Seeding {seedData.rooms.Count} Rooms...");
                    await context.SaveChangesAsync();
                }

                if (seedData.equipmentTypes.Any() && !await context.EquipmentTypes.AnyAsync())
                {
                    await context.EquipmentTypes.AddRangeAsync(seedData.equipmentTypes);
                    Console.WriteLine($"Seeding {seedData.equipmentTypes.Count} Equipment Types...");
                    await context.SaveChangesAsync();
                }

                if (seedData.equipments.Any() && !await context.Equipment.AnyAsync())
                {
                    await context.Equipment.AddRangeAsync(seedData.equipments);
                    Console.WriteLine($"Seeding {seedData.equipments.Count} Equipments...");
                    await context.SaveChangesAsync();
                }

                Console.WriteLine("FPT University data seeded successfully.");
            }
            // Seed default FPT Accounts for each role
            await SeedAccountsAsync(context, hashPassword);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred while seeding FPT data: {ex.Message}");
            throw;
        }
    }

    private static async Task SeedAccountsAsync(ScemsDbContext context, Func<string, string> hashPassword)
    {
        var accountsToSeed = new List<Account>
        {
            new Account
            {
                Email = "bookingstaff@fpt.edu.vn",
                FullName = "Nguyễn Văn Hùng",
                Role = AccountRole.BookingStaff,
                Status = AccountStatus.Active,
                PasswordHash = hashPassword("Password123!"),
                Phone = "0901234567"
            },
            new Account
            {
                Email = "assetstaff@fpt.edu.vn",
                FullName = "Trần Thị Mai",
                Role = AccountRole.AssetStaff,
                Status = AccountStatus.Active,
                PasswordHash = hashPassword("Password123!"),
                Phone = "0902345678"
            },
            new Account
            {
                Email = "guard@fpt.edu.vn",
                FullName = "Lê Văn Bảo",
                Role = AccountRole.Guard,
                Status = AccountStatus.Active,
                PasswordHash = hashPassword("Password123!"),
                Phone = "0903456789"
            },
            new Account
            {
                Email = "lecturer@fpt.edu.vn",
                FullName = "Phạm Thu Hà",
                Role = AccountRole.Lecturer,
                Status = AccountStatus.Active,
                PasswordHash = hashPassword("Password123!"),
                Phone = "0904567890"
            },
            new Account
            {
                Email = "student@fpt.edu.vn",
                FullName = "Hoàng Minh Trí",
                StudentCode = "HE150000",
                Role = AccountRole.Student,
                Status = AccountStatus.Active,
                PasswordHash = hashPassword("Password123!"),
                Phone = "0905678901"
            }
        };

        foreach (var account in accountsToSeed)
        {
            // Only seed if an account with this email doesn't exist already
            if (!await context.Accounts.IgnoreQueryFilters().AnyAsync(a => a.Email == account.Email))
            {
                await context.Accounts.AddAsync(account);
            }
        }

        await context.SaveChangesAsync();
    }
}
