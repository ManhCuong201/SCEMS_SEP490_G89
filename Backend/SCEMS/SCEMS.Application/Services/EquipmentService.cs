using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using AutoMapper;

using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Equipment;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class EquipmentService : IEquipmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public EquipmentService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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
        var equipment = _mapper.Map<Equipment>(dto);
        
        await _unitOfWork.Equipment.AddAsync(equipment);
        
        // Track history
        await TrackEquipmentHistoryAsync(equipment.Id, equipment.RoomId, "Initial assignment");
        
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<EquipmentResponseDto>(equipment);
    }

    public async Task<EquipmentResponseDto?> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto dto)
    {
        var equipment = await _unitOfWork.Equipment.GetByIdAsync(id);
        if (equipment == null) return null;

        if (!string.IsNullOrEmpty(dto.Name)) equipment.Name = dto.Name;
        if (dto.RoomId.HasValue && dto.RoomId.Value != equipment.RoomId)
        {
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
             await TrackEquipmentHistoryAsync(equipment.Id, dto.RoomId.Value, "Moved via update");
             
             equipment.RoomId = dto.RoomId.Value;
        }
        
        if (dto.Status.HasValue) equipment.Status = dto.Status.Value;

        _unitOfWork.Equipment.Update(equipment);
        await _unitOfWork.SaveChangesAsync();

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

        _unitOfWork.Equipment.Delete(equipment);
        await _unitOfWork.SaveChangesAsync();
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
    public async Task<int> ImportEquipmentAsync(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

        var importedCount = 0;
        var types = await _unitOfWork.EquipmentTypes.GetAll().ToListAsync();
        var rooms = await _unitOfWork.Rooms.GetAll().ToListAsync();

        foreach (var row in rows)
        {
            try
            {
                var name = row.Cell(1).GetValue<string>();
                var description = row.Cell(2).GetValue<string>();
                var typeCode = row.Cell(3).GetValue<string>();
                var roomCode = row.Cell(4).GetValue<string>();
                var statusStr = row.Cell(5).GetValue<string>();

                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(typeCode) || string.IsNullOrWhiteSpace(roomCode))
                    continue;

                var type = types.FirstOrDefault(t => t.Code.Equals(typeCode, StringComparison.OrdinalIgnoreCase));
                var room = rooms.FirstOrDefault(r => r.RoomCode.Equals(roomCode, StringComparison.OrdinalIgnoreCase));

                if (type == null || room == null)
                    continue;

                EquipmentStatus status = EquipmentStatus.Working;
                if (Enum.TryParse<EquipmentStatus>(statusStr, true, out var parsedStatus))
                {
                    status = parsedStatus;
                }

                var equipment = new Equipment
                {
                    Name = name,
                    Description = description,
                    EquipmentTypeId = type.Id,
                    RoomId = room.Id,
                    Status = status
                };

                await _unitOfWork.Equipment.AddAsync(equipment);
                importedCount++;
            }
            catch
            {
                continue;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return importedCount;
    }


    public async Task<Stream> GetTemplateStreamAsync()
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Equipment Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Name";
        worksheet.Cell(1, 2).Value = "Description";
        worksheet.Cell(1, 3).Value = "Type Code";
        worksheet.Cell(1, 4).Value = "Room Code";
        worksheet.Cell(1, 5).Value = "Status";

        // Style
        var header = worksheet.Range("A1:E1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample Data / Comments
        worksheet.Cell(2, 1).Value = "Dell Monitor";
        worksheet.Cell(2, 2).Value = "24 inch monitor";
        worksheet.Cell(2, 3).Value = "MON-01";
        worksheet.Cell(2, 4).Value = "A101";
        worksheet.Cell(2, 5).Value = "Working";
        
        // Add comments to help user
        worksheet.Cell(1, 3).GetComment().AddText("Must match an existing Equipment Type Code");
        worksheet.Cell(1, 4).GetComment().AddText("Must match an existing Room Code");
        worksheet.Cell(1, 5).GetComment().AddText("Working, Maintenance, Broken, or Retired");

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
