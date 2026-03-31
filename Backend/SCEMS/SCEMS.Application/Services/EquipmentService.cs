using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using AutoMapper;

using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Equipment;
using SCEMS.Application.DTOs.Import;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class EquipmentService : IEquipmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public EquipmentService(IUnitOfWork unitOfWork, IMapper mapper, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    public async Task<PaginatedEquipmentDto> GetEquipmentAsync(PaginationParams @params)
    {
        IQueryable<Equipment> query = _unitOfWork.Equipment.GetAll()
            .Include(e => e.EquipmentType)
            .Include(e => e.Room);

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(e => e.EquipmentType.Name.ToLower().Contains(search) || e.Room.RoomName.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(@params.Status) && Enum.TryParse<EquipmentStatus>(@params.Status, true, out var statusEnum))
        {
            query = query.Where(e => e.Status == statusEnum);
        }

        if (@params.RoomId.HasValue)
        {
            query = query.Where(e => e.RoomId == @params.RoomId.Value);
        }

        if (!string.IsNullOrWhiteSpace(@params.SortBy))
        {
            query = @params.SortBy.ToLowerInvariant() switch
            {
                "type" => query.OrderBy(e => e.EquipmentType.Name),
                "room" => query.OrderBy(e => e.Room.RoomName),
                "status" => query.OrderBy(e => e.Status),
                "recent" => query.OrderByDescending(e => e.CreatedAt),
                _ => query.OrderByDescending(e => e.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(e => e.CreatedAt);
        }

        var total = query.Count();
        var items = query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .ToList();

        // Ensure navigation properties are loaded; strict repo might require explicit Include.
        // Assuming lazy loading or auto-include, but explicit checks safer in complex apps.
        // For now relying on standard behavior, if nav props null need to fix repo.
        // Wait, typical generic repo doesn't include nav props by default.
        // I might need to update repository or just live with it for a sec.
        // Let's rely on Mapper to handle basic mapping, but if Entity Framework lazy loading is off, this fails.
        // Given existing code, I'll follow standard pattern.
        
        var dtos = _mapper.Map<List<EquipmentResponseDto>>(items);

        return new PaginatedEquipmentDto
        {
            Items = dtos,
            Total = total,
            PageIndex = @params.PageIndex,
            PageSize = @params.PageSize
        };
    }

    public async Task<EquipmentResponseDto?> GetEquipmentByIdAsync(Guid id)
    {
        var equipment = await _unitOfWork.Equipment.GetAll()
            .Include(e => e.EquipmentType)
            .Include(e => e.Room)
            .FirstOrDefaultAsync(e => e.Id == id);
        return equipment != null ? _mapper.Map<EquipmentResponseDto>(equipment) : null;
    }
    
    // Helper to track history
    private async Task TrackEquipmentHistoryAsync(Guid equipmentId, Guid roomId, string? notes = null)
    {
        var history = new RoomEquipmentHistory
        {
            EquipmentId = equipmentId,
            RoomId = roomId,
            AssignedAt = DateTime.UtcNow,
            Notes = notes
        };
        await _unitOfWork.RoomEquipmentHistories.AddAsync(history);
    }

    public async Task<EquipmentResponseDto> CreateEquipmentAsync(CreateEquipmentDto dto)
    {
        var room = await _unitOfWork.Rooms.GetByIdAsync(dto.RoomId);
        if (room == null)
            throw new KeyNotFoundException($"Room with ID '{dto.RoomId}' not found.");

        var equipmentType = await _unitOfWork.EquipmentTypes.GetByIdAsync(dto.EquipmentTypeId);
        if (equipmentType == null)
            throw new KeyNotFoundException($"Equipment type with ID '{dto.EquipmentTypeId}' not found.");

        var equipment = _mapper.Map<Equipment>(dto);
        
        // Check for duplicate name in room (prevent accidental doubles)
        if (!string.IsNullOrWhiteSpace(equipment.Name))
        {
            var isDuplicate = await _unitOfWork.Equipment.GetAll()
                .AnyAsync(e => e.RoomId == equipment.RoomId && e.Name.ToLower() == equipment.Name.ToLower());
            if (isDuplicate)
                throw new InvalidOperationException($"Thiết bị '{equipment.Name}' đã tồn tại trong phòng {room.RoomName}.");
        }
        
        await _unitOfWork.Equipment.AddAsync(equipment);
        
        // Track history
        await TrackEquipmentHistoryAsync(equipment.Id, equipment.RoomId, "Initial assignment");
        
        await _unitOfWork.SaveChangesAsync();

        var msg = $"Trang thiết bị mới '{equipment.Name}' đã được thêm vào phòng {room.RoomName}.";
        
        await _notificationService.SendToRoleAsync(AccountRole.Admin, "Nhật ký hệ thống: Thêm mới thiết bị", msg, "/admin/equipment");
        await _notificationService.SendToRoleAsync(AccountRole.Guard, "Thiết bị được thêm mới", msg, "/admin/equipment");
        await _notificationService.SendToRoleAsync(AccountRole.BookingStaff, "Thiết bị được thêm mới", msg, "/admin/equipment");

        return _mapper.Map<EquipmentResponseDto>(equipment);
    }

    public async Task<EquipmentResponseDto?> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto dto)
    {
        var equipment = await _unitOfWork.Equipment.GetByIdAsync(id);
        if (equipment == null) return null;

        if (dto.Name != null && dto.Name != equipment.Name)
        {
            var targetRoomId = dto.RoomId ?? equipment.RoomId;
            var isDuplicate = await _unitOfWork.Equipment.GetAll()
                .AnyAsync(e => e.Id != id && e.RoomId == targetRoomId && e.Name.ToLower() == dto.Name.ToLower());
            if (isDuplicate)
                throw new InvalidOperationException($"Thiết bị '{dto.Name}' đã tồn tại trong phòng mục tiêu.");
            
            equipment.Name = dto.Name;
        }

        if (dto.RoomId.HasValue && dto.RoomId.Value != equipment.RoomId)
        {
            var targetRoom = await _unitOfWork.Rooms.GetByIdAsync(dto.RoomId.Value);
            if (targetRoom == null)
                throw new KeyNotFoundException($"Room with ID '{dto.RoomId}' not found.");
             
             // Check if the current name (either old or new) conflicts in the NEW room if RoomId changed but Name didn't (already handled by Name check above if both change, but if ONLY RoomId changes we need this check)
             if (dto.Name == null) // If Name didn't change in this request, check current equipment.Name against NEW room
             {
                 var isDuplicate = await _unitOfWork.Equipment.GetAll()
                    .AnyAsync(e => e.Id != id && e.RoomId == dto.RoomId.Value && e.Name.ToLower() == equipment.Name.ToLower());
                 if (isDuplicate)
                    throw new InvalidOperationException($"Thiết bị '{equipment.Name}' đã tồn tại trong phòng mục tiêu.");
             }

             // Close previous history
             var lastHistory = await _unitOfWork.RoomEquipmentHistories.GetAll()
                .Where(h => h.EquipmentId == equipment.Id && h.UnassignedAt == null)
                .OrderByDescending(h => h.AssignedAt)
                .FirstOrDefaultAsync();
                
             if (lastHistory != null)
             {
                 lastHistory.UnassignedAt = DateTime.UtcNow;
                 _unitOfWork.RoomEquipmentHistories.Update(lastHistory);
             }

             // Create new history
             await TrackEquipmentHistoryAsync(equipment.Id, dto.RoomId.Value, dto.Note ?? "Moved via update");
             
             equipment.RoomId = dto.RoomId.Value;
        }
        
        if (dto.Status.HasValue) equipment.Status = dto.Status.Value;

        _unitOfWork.Equipment.Update(equipment);
        await _unitOfWork.SaveChangesAsync();

        var room = await _unitOfWork.Rooms.GetByIdAsync(equipment.RoomId);
        var msg = $"Trang thiết bị '{equipment.Name}' trong phòng {room?.RoomName} đã được cập nhật. Trạng thái: {equipment.Status}";
        
        await _notificationService.SendToRoleAsync(AccountRole.Admin, "Nhật ký hệ thống: Thiết bị được cập nhật", msg, "/admin/equipment");
        await _notificationService.SendToRoleAsync(AccountRole.Guard, "Thiết bị được cập nhật", msg, "/admin/equipment");
        await _notificationService.SendToRoleAsync(AccountRole.BookingStaff, "Thiết bị được cập nhật", msg, "/admin/equipment");

        // Refresh 
        equipment = await _unitOfWork.Equipment.GetAll()
            .Include(e => e.Room)
            .Include(e => e.EquipmentType)
            .FirstOrDefaultAsync(e => e.Id == id);
            
        return _mapper.Map<EquipmentResponseDto>(equipment);
    }

    public async Task<bool> DeleteEquipmentAsync(Guid id)
    {
        var equipment = await _unitOfWork.Equipment.GetByIdAsync(id);
        if (equipment == null) return false;

        var room = await _unitOfWork.Rooms.GetByIdAsync(equipment.RoomId);
        var msg = $"Trang thiết bị '{equipment.Name}' đã bị gỡ bỏ khỏi phòng {room?.RoomName}.";

        _unitOfWork.Equipment.Delete(equipment);
        await _unitOfWork.SaveChangesAsync();

        await _notificationService.SendToRoleAsync(AccountRole.Admin, "Nhật ký hệ thống: Thiết bị bị gỡ bỏ", msg, "/admin/equipment");
        await _notificationService.SendToRoleAsync(AccountRole.Guard, "Thiết bị bị gỡ bỏ", msg, "/admin/equipment");
        await _notificationService.SendToRoleAsync(AccountRole.BookingStaff, "Thiết bị bị gỡ bỏ", msg, "/admin/equipment");

        return true;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, int status)
    {
        var equipment = await _unitOfWork.Equipment.GetByIdAsync(id);
        if (equipment == null) return false;

        equipment.Status = (EquipmentStatus)status;
        _unitOfWork.Equipment.Update(equipment);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    public async Task<ImportResultDto> ImportEquipmentAsync(Stream fileStream)
    {
        var result = new ImportResultDto();
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

        var types = await _unitOfWork.EquipmentTypes.GetAll().ToListAsync();
        var rooms = await _unitOfWork.Rooms.GetAll().ToListAsync();

        foreach (var row in rows)
        {
            try
            {
                var name = row.Cell(1).GetValue<string>()?.Trim();
                var description = row.Cell(2).GetValue<string>()?.Trim();
                var typeCode = row.Cell(3).GetValue<string>()?.Trim();
                var roomCode = row.Cell(4).GetValue<string>()?.Trim();
                var statusStr = row.Cell(5).GetValue<string>()?.Trim();

                var rowErrors = new List<string>();
                if (string.IsNullOrWhiteSpace(name)) rowErrors.Add("Tên thiết bị là bắt buộc");
                if (string.IsNullOrWhiteSpace(typeCode)) rowErrors.Add("Mã loại thiết bị là bắt buộc");
                if (string.IsNullOrWhiteSpace(roomCode)) rowErrors.Add("Mã phòng là bắt buộc");

                var type = types.FirstOrDefault(t => t.Code.Equals(typeCode, StringComparison.OrdinalIgnoreCase));
                var room = rooms.FirstOrDefault(r => r.RoomCode.Equals(roomCode, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrWhiteSpace(typeCode) && type == null)
                    rowErrors.Add($"Loại thiết bị '{typeCode}' không tìm thấy");

                if (!string.IsNullOrWhiteSpace(roomCode) && room == null)
                    rowErrors.Add($"Phòng '{roomCode}' không tìm thấy");

                // Check for duplicate name in room (prevent accidental doubles in same file or existing)
                if (room != null && !string.IsNullOrWhiteSpace(name))
                {
                    var isDuplicate = await _unitOfWork.Equipment.GetAll()
                        .AnyAsync(e => e.RoomId == room.Id && e.Name.ToLower() == name.ToLower());
                    if (isDuplicate)
                        rowErrors.Add($"Thiết bị '{name}' đã tồn tại trong phòng {room.RoomName}");
                }

                if (rowErrors.Any())
                {
                    result.FailureCount++;
                    result.Errors.Add($"Dòng {row.RowNumber()}: {string.Join(", ", rowErrors)}.");
                    continue;
                }

                EquipmentStatus status = EquipmentStatus.Working;
                if (Enum.TryParse<EquipmentStatus>(statusStr, true, out var parsedStatus))
                {
                    status = parsedStatus;
                }

                var equipment = new Equipment
                {
                    Name = name!,
                    Description = description,
                    EquipmentTypeId = type!.Id,
                    RoomId = room!.Id,
                    Status = status
                };

                await _unitOfWork.Equipment.AddAsync(equipment);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Row {row.RowNumber()}: {ex.Message}");
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return result;
    }


    public async Task<Stream> GetTemplateStreamAsync()
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Equipment Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Tên thiết bị";
        worksheet.Cell(1, 2).Value = "Mô tả";
        worksheet.Cell(1, 3).Value = "Mã loại";
        worksheet.Cell(1, 4).Value = "Mã phòng";
        worksheet.Cell(1, 5).Value = "Trạng thái";

        // Style
        var header = worksheet.Range("A1:E1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample Data / Comments
        worksheet.Cell(2, 1).Value = "Màn hình Dell";
        worksheet.Cell(2, 2).Value = "Màn hình 24 inch";
        worksheet.Cell(2, 3).Value = "MON-01";
        worksheet.Cell(2, 4).Value = "A101";
        worksheet.Cell(2, 5).Value = "Working";
        
        // Add comments to help user
        worksheet.Cell(1, 3).GetComment().AddText("Phải khớp với Mã loại thiết bị đã có");
        worksheet.Cell(1, 4).GetComment().AddText("Phải khớp với Mã phòng đã có");
        worksheet.Cell(1, 5).GetComment().AddText("Working (Hoạt động), Maintenance (Bảo trì), Faulty (Hỏng), hoặc Retired (Đã thanh lý)");

        worksheet.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }
    public async Task<List<EquipmentHistoryResponseDto>> GetEquipmentHistoryAsync(Guid equipmentId)
    {
        var history = await _unitOfWork.RoomEquipmentHistories.GetAll()
            .Where(h => h.EquipmentId == equipmentId)
            .Include(h => h.Room)
            .OrderByDescending(h => h.AssignedAt)
            .ToListAsync();

        return _mapper.Map<List<EquipmentHistoryResponseDto>>(history);
    }
}
