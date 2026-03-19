using System.Text.Json;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;

namespace SCEMS.Infrastructure.Data
{
    // Class chứa dữ liệu Mapping từ file JSON
    public class ExtendedMockData
    {
        public List<Booking_History> BookingHistories { get; set; } = new();
        public List<Classroom_Report> ClassroomReports { get; set; } = new();
        public List<Classroom_Status> ClassroomStatuses { get; set; } = new();
        public List<Equipment_Report> EquipmentReports { get; set; } = new();
        public List<RoomEquipmentHistory> RoomEquipmentHistories { get; set; } = new();
    }

    public static class ExtendedDataSeeder
    {
        public static async Task SeedAsync(ScemsDbContext context, string basePath)
        {
            // Trỏ chính xác đến thư mục Data/SeedData của Infrastructure layer
            var filePath = Path.Combine(basePath, "SCEMS.Infrastructure", "Data", "SeedData", "extended_mock_data.json");

            // Nếu bạn copy file thẳng vào SCEMS.Api/Data/SeedData thì dùng đường dẫn này:
            if (!File.Exists(filePath))
            {
                filePath = Path.Combine(basePath, "SCEMS.Api", "Data", "SeedData", "extended_mock_data.json");
            }

            if (!File.Exists(filePath))
            {
                Console.WriteLine($"[Seeder] Không tìm thấy file JSON tại: {filePath}");
                return;
            }

            var jsonString = await File.ReadAllTextAsync(filePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var data = JsonSerializer.Deserialize<ExtendedMockData>(jsonString, options);

            if (data == null) return;

            if (!context.BookingHistories.Any() && data.BookingHistories.Any())
                await context.BookingHistories.AddRangeAsync(data.BookingHistories);

            if (!context.ClassroomReports.Any() && data.ClassroomReports.Any())
                await context.ClassroomReports.AddRangeAsync(data.ClassroomReports);

            if (!context.ClassroomStatuses.Any() && data.ClassroomStatuses.Any())
                await context.ClassroomStatuses.AddRangeAsync(data.ClassroomStatuses);

            if (!context.EquipmentReports.Any() && data.EquipmentReports.Any())
                await context.EquipmentReports.AddRangeAsync(data.EquipmentReports);

            if (!context.RoomEquipmentHistories.Any() && data.RoomEquipmentHistories.Any())
                await context.RoomEquipmentHistories.AddRangeAsync(data.RoomEquipmentHistories);

            // Lưu toàn bộ dữ liệu mới
            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync();
                Console.WriteLine("✅ Đã seed thành công 75 bản ghi vào 5 bảng lịch sử và báo cáo (BookingHistories, Reports,...)!");
            }
        }
    }
}