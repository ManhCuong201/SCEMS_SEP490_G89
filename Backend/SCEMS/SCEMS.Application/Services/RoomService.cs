using AutoMapper;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Room;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class RoomService : IRoomService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public RoomService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedRoomsDto> GetRoomsAsync(PaginationParams @params)
    {
        var query = _unitOfWork.Rooms.GetAll();

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(r => r.RoomCode.ToLower().Contains(search) || r.RoomName.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(@params.SortBy))
        {
            query = @params.SortBy.ToLowerInvariant() switch
            {
                "code" => query.OrderBy(r => r.RoomCode),
                "name" => query.OrderBy(r => r.RoomName),
                "capacity" => query.OrderBy(r => r.Capacity),
                "recent" => query.OrderByDescending(r => r.CreatedAt),
                _ => query.OrderBy(r => r.RoomCode)
            };
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        var total = query.Count();
        var items = query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .ToList();

        var dtos = items.Select(r => new RoomResponseDto
        {
            Id = r.Id,
            RoomCode = r.RoomCode,
            RoomName = r.RoomName,
            Capacity = r.Capacity,
            Status = r.Status,
            EquipmentCount = r.Equipment.Count,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();

        return new PaginatedRoomsDto
        {
            Items = dtos,
            Total = total,
            PageIndex = @params.PageIndex,
            PageSize = @params.PageSize
        };
    }

    public async Task<RoomResponseDto?> GetRoomByIdAsync(Guid id)
    {
        var room = await _unitOfWork.Rooms.GetByIdAsync(id);
        if (room == null)
        {
            return null;
        }

        return new RoomResponseDto
        {
            Id = room.Id,
            RoomCode = room.RoomCode,
            RoomName = room.RoomName,
            Capacity = room.Capacity,
            Status = room.Status,
            EquipmentCount = room.Equipment.Count,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt
        };
    }

    public async Task<RoomResponseDto> CreateRoomAsync(CreateRoomDto dto)
    {
        var existingRoom = await _unitOfWork.Rooms.GetByRoomCodeAsync(dto.RoomCode);
        if (existingRoom != null)
        {
            throw new InvalidOperationException($"Room with code {dto.RoomCode} already exists");
        }

        var room = new Room
        {
            RoomCode = dto.RoomCode,
            RoomName = dto.RoomName,
            Capacity = dto.Capacity
        };

        await _unitOfWork.Rooms.AddAsync(room);
        await _unitOfWork.SaveChangesAsync();

        return new RoomResponseDto
        {
            Id = room.Id,
            RoomCode = room.RoomCode,
            RoomName = room.RoomName,
            Capacity = room.Capacity,
            Status = room.Status,
            EquipmentCount = 0,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt
        };
    }

    public async Task<RoomResponseDto?> UpdateRoomAsync(Guid id, UpdateRoomDto dto)
    {
        var room = await _unitOfWork.Rooms.GetByIdAsync(id);
        if (room == null)
        {
            return null;
        }

        var existingRoom = await _unitOfWork.Rooms.GetByRoomCodeAsync(dto.RoomCode);
        if (existingRoom != null && existingRoom.Id != id)
        {
            throw new InvalidOperationException($"Room with code {dto.RoomCode} already exists");
        }

        room.RoomCode = dto.RoomCode;
        room.RoomName = dto.RoomName;
        room.Capacity = dto.Capacity;

        _unitOfWork.Rooms.Update(room);
        await _unitOfWork.SaveChangesAsync();

        return new RoomResponseDto
        {
            Id = room.Id,
            RoomCode = room.RoomCode,
            RoomName = room.RoomName,
            Capacity = room.Capacity,
            Status = room.Status,
            EquipmentCount = room.Equipment.Count,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt
        };
    }

    public async Task<bool> DeleteRoomAsync(Guid id)
    {
        var room = await _unitOfWork.Rooms.GetByIdAsync(id);
        if (room == null)
        {
            return false;
        }

        _unitOfWork.Rooms.Delete(room);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, int status)
    {
        var room = await _unitOfWork.Rooms.GetByIdAsync(id);
        if (room == null)
        {
            return false;
        }

        room.Status = (SCEMS.Domain.Enums.RoomStatus)status;
        _unitOfWork.Rooms.Update(room);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
}
