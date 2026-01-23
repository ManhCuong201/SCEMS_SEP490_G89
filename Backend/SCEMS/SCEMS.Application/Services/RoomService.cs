using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Room;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using ClosedXML.Excel;

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
        IQueryable<Room> query = _unitOfWork.Rooms.GetAll().Include(r => r.Bookings).Include(r => r.Equipment);

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
            PendingRequestsCount = r.Bookings.Count(b => b.Status == BookingStatus.Pending),
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
        var room = await _unitOfWork.Rooms.GetAll()
            .Include(r => r.Bookings)
            .Include(r => r.Equipment)
            .FirstOrDefaultAsync(r => r.Id == id);

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

    public async Task<int> ImportRoomAsync(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

        var importedCount = 0;

        foreach (var row in rows)
        {
            try
            {
                var code = row.Cell(1).GetValue<string>();
                var name = row.Cell(2).GetValue<string>();
                var capacityStr = row.Cell(3).GetValue<string>();
                var statusStr = row.Cell(4).GetValue<string>();

                if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
                    continue;

                // Check duplicate
                var existing = await _unitOfWork.Rooms.GetByRoomCodeAsync(code);
                if (existing != null) continue;

                int capacity = 30;
                if (!int.TryParse(capacityStr, out capacity)) capacity = 30;

                RoomStatus status = RoomStatus.Available;
                if (Enum.TryParse<RoomStatus>(statusStr, true, out var parsedStatus))
                    status = parsedStatus;

                var room = new Room
                {
                    RoomCode = code,
                    RoomName = name,
                    Capacity = capacity,
                    Status = status
                };

                await _unitOfWork.Rooms.AddAsync(room);
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
        var worksheet = workbook.Worksheets.Add("Room Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Room Code";
        worksheet.Cell(1, 2).Value = "Room Name";
        worksheet.Cell(1, 3).Value = "Capacity";
        worksheet.Cell(1, 4).Value = "Status";

        // Style
        var header = worksheet.Range("A1:D1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample
        worksheet.Cell(2, 1).Value = "A101";
        worksheet.Cell(2, 2).Value = "Lab Room 1";
        worksheet.Cell(2, 3).Value = 40;
        worksheet.Cell(2, 4).Value = "Available";

        worksheet.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }
}
