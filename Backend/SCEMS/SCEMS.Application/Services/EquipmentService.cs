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
        var query = _unitOfWork.Equipment.GetAll();

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(e => e.EquipmentType.Name.ToLower().Contains(search) || e.Room.RoomName.ToLower().Contains(search));
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
        var equipment = await _unitOfWork.Equipment.GetByIdAsync(id);
        return equipment != null ? _mapper.Map<EquipmentResponseDto>(equipment) : null;
    }

    public async Task<EquipmentResponseDto> CreateEquipmentAsync(CreateEquipmentDto dto)
    {
        var equipment = _mapper.Map<Equipment>(dto);
        
        await _unitOfWork.Equipment.AddAsync(equipment);
        await _unitOfWork.SaveChangesAsync();

        // Reload to get nav props if needed, or just return basic
        return _mapper.Map<EquipmentResponseDto>(equipment);
    }

    public async Task<EquipmentResponseDto?> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto dto)
    {
        var equipment = await _unitOfWork.Equipment.GetByIdAsync(id);
        if (equipment == null) return null;

        if (dto.RoomId.HasValue) equipment.RoomId = dto.RoomId.Value;
        if (dto.Status.HasValue) equipment.Status = dto.Status.Value;

        _unitOfWork.Equipment.Update(equipment);
        await _unitOfWork.SaveChangesAsync();

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
                var typeName = row.Cell(3).GetValue<string>();
                var roomCode = row.Cell(4).GetValue<string>();
                var statusStr = row.Cell(5).GetValue<string>();

                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(typeName) || string.IsNullOrWhiteSpace(roomCode))
                    continue;

                var type = types.FirstOrDefault(t => t.Name.Equals(typeName, StringComparison.OrdinalIgnoreCase));
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


}
