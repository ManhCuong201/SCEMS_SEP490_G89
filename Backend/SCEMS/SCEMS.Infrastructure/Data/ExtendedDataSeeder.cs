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
            
            // Lấy danh sách ID hiện có để tránh lỗi FK Constraint
            var existingBookingIds = context.Bookings.Select(b => b.Id).ToHashSet();
            var existingRoomIds = context.Rooms.Select(r => r.Id).ToHashSet();
            var existingEquipIds = context.Equipment.Select(e => e.Id).ToHashSet();

            if (!context.BookingHistories.Any() && data.BookingHistories.Any())
            {
                var validHistories = data.BookingHistories
                    .Where(bh => existingBookingIds.Contains(bh.BookingId))
                    .ToList();
                
                if (validHistories.Any())
                {
                    await context.BookingHistories.AddRangeAsync(validHistories);
                }
            }

            if (!context.ClassroomReports.Any() && data.ClassroomReports.Any())
            {
                var validReports = data.ClassroomReports
                    .Where(cr => existingRoomIds.Contains(cr.RoomId))
                    .ToList();
                if (validReports.Any())
                    await context.ClassroomReports.AddRangeAsync(validReports);
            }

            if (!context.ClassroomStatuses.Any() && data.ClassroomStatuses.Any())
            {
                var validStatuses = data.ClassroomStatuses
                    .Where(cs => existingRoomIds.Contains(cs.RoomId))
                    .ToList();
                if (validStatuses.Any())
                    await context.ClassroomStatuses.AddRangeAsync(validStatuses);
            }

            if (!context.EquipmentReports.Any() && data.EquipmentReports.Any())
            {
                var validReports = data.EquipmentReports
                    .Where(er => existingEquipIds.Contains(er.EquipmentId))
                    .ToList();
                if (validReports.Any())
                    await context.EquipmentReports.AddRangeAsync(validReports);
            }

            if (!context.RoomEquipmentHistories.Any() && data.RoomEquipmentHistories.Any())
            {
                var validHistories = data.RoomEquipmentHistories
                    .Where(reh => existingRoomIds.Contains(reh.RoomId) && existingEquipIds.Contains(reh.EquipmentId))
                    .ToList();
                if (validHistories.Any())
                    await context.RoomEquipmentHistories.AddRangeAsync(validHistories);
            }

            // Lưu toàn bộ dữ liệu mới
            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync();
                Console.WriteLine("✅ Đã seed thành công 75 bản ghi vào 5 bảng lịch sử và báo cáo (BookingHistories, Reports,...)!");
            }
        }
    }
}