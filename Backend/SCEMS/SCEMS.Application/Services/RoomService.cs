using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Room;
using SCEMS.Application.DTOs.Import;
using SCEMS.Application.DTOs.Department;
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
        IQueryable<Room> query = _unitOfWork.Rooms.GetAll()
            .Include(r => r.RoomType)
            .Include(r => r.Department);

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(r => r.RoomCode.ToLower().Contains(search) || r.RoomName.ToLower().Contains(search));
        }

        if (@params.DepartmentId.HasValue)
        {
            query = query.Where(r => r.DepartmentId == @params.DepartmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(@params.SortBy))
        {
            query = @params.SortBy.ToLowerInvariant() switch
            {
                "code" => query.OrderBy(r => r.RoomCode),
                "name" => query.OrderBy(r => r.RoomName),
                "capacity" => query.OrderBy(r => r.Capacity),
                "department" => query.OrderBy(r => r.Department != null ? r.Department.DepartmentCode : ""),
                "recent" => query.OrderByDescending(r => r.CreatedAt),
                _ => query.OrderBy(r => r.RoomCode)
            };
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        var total = await query.CountAsync();

        // Project counts as inline SQL subqueries to avoid loading all child rows into memory
        var items = await query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .Select(r => new RoomResponseDto
            {
                Id = r.Id,
                RoomCode = r.RoomCode,
                RoomName = r.RoomName,
                Capacity = r.Capacity,
                Status = r.Status,
                EquipmentCount = r.Equipment.Count(),
                PendingRequestsCount = r.Bookings.Count(b => b.Status == BookingStatus.Pending),
                RoomTypeId = r.RoomTypeId,
                RoomTypeName = r.RoomType != null ? r.RoomType.Name : "N/A",
                Building = r.Building ?? "N/A",
                DepartmentId = r.DepartmentId,
                DepartmentName = r.Department != null ? r.Department.DepartmentName : "N/A",
                DepartmentCode = r.Department != null ? r.Department.DepartmentCode : "N/A",
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync();

        return new PaginatedRoomsDto
        {
            Items = items,
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
            .Include(r => r.RoomType)
            .Include(r => r.Department)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (room == null)
        {
            return null;
        }

        return _mapper.Map<RoomResponseDto>(room);
    }

    public async Task<RoomResponseDto> CreateRoomAsync(CreateRoomDto dto)
    {
        var existingRoom = await _unitOfWork.Rooms.GetByRoomCodeAsync(dto.RoomCode);
        if (existingRoom != null)
        {
            throw new InvalidOperationException($"Room with code {dto.RoomCode} already exists");
        }

        if (dto.RoomTypeId.HasValue)
        {
            var roomType = await _unitOfWork.RoomTypes.GetByIdAsync(dto.RoomTypeId.Value);
            if (roomType == null)
                throw new KeyNotFoundException($"Room type with ID '{dto.RoomTypeId}' not found.");
        }

        if (dto.DepartmentId.HasValue)
        {
            var department = await _unitOfWork.Departments.GetByIdAsync(dto.DepartmentId.Value);
            if (department == null)
                throw new KeyNotFoundException($"Department with ID '{dto.DepartmentId}' not found.");
        }

        var room = new Room
        {
            RoomCode = dto.RoomCode,
            RoomName = dto.RoomName,
            Capacity = dto.Capacity,
            Building = dto.Building,
            RoomTypeId = dto.RoomTypeId,
            DepartmentId = dto.DepartmentId
        };

        await _unitOfWork.Rooms.AddAsync(room);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<RoomResponseDto>(room);
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

        if (dto.RoomTypeId.HasValue)
        {
            var roomType = await _unitOfWork.RoomTypes.GetByIdAsync(dto.RoomTypeId.Value);
            if (roomType == null)
                throw new KeyNotFoundException($"Room type with ID '{dto.RoomTypeId}' not found.");
        }

        if (dto.DepartmentId.HasValue)
        {
            var department = await _unitOfWork.Departments.GetByIdAsync(dto.DepartmentId.Value);
            if (department == null)
                throw new KeyNotFoundException($"Department with ID '{dto.DepartmentId}' not found.");
        }

        room.RoomCode = dto.RoomCode;
        room.RoomName = dto.RoomName;
        room.Building = dto.Building;
        room.Capacity = dto.Capacity;
        room.RoomTypeId = dto.RoomTypeId;
        room.DepartmentId = dto.DepartmentId;

        _unitOfWork.Rooms.Update(room);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<RoomResponseDto>(room);
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

    public async Task<ImportResultDto> ImportRoomAsync(Stream fileStream)
    {
        var result = new ImportResultDto();
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

        // Fetch all room types and existing rooms to check logic in-memory
        var roomTypes = await _unitOfWork.RoomTypes.GetAllAsync();
        var existingRoomCodes = await _unitOfWork.Rooms.GetAll().Select(r => r.RoomCode.ToLower()).ToListAsync();
        var processedCodes = new HashSet<string>(existingRoomCodes, StringComparer.OrdinalIgnoreCase);

        foreach (var row in rows)
        {
            try
            {
                var code = row.Cell(1).GetValue<string>()?.Trim();
                var name = row.Cell(2).GetValue<string>()?.Trim();
                var capacityStr = row.Cell(3).GetValue<string>()?.Trim();
                var statusStr = row.Cell(4).GetValue<string>()?.Trim();
                var roomTypeCode = row.Cell(5).GetValue<string>()?.Trim();
                var deptCode = row.Cell(6).GetValue<string>()?.Trim();

                var roomTypeFound = true;
                var deptFound = true;
                var rowErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(code)) rowErrors.Add("Mã phòng là bắt buộc");
                if (string.IsNullOrWhiteSpace(name)) rowErrors.Add("Tên phòng là bắt buộc");

                if (!string.IsNullOrWhiteSpace(code) && processedCodes.Contains(code.ToLower()))
                {
                    rowErrors.Add($"Mã phòng '{code}' đã tồn tại hoặc bị trùng lặp trong tệp");
                }

                Guid? typeId = null;
                if (!string.IsNullOrWhiteSpace(roomTypeCode))
                {
                    var type = roomTypes.FirstOrDefault(t => t.Code.Equals(roomTypeCode, StringComparison.OrdinalIgnoreCase));
                    if (type != null) typeId = type.Id;
                    else
                    {
                        roomTypeFound = false;
                        rowErrors.Add($"Loại phòng '{roomTypeCode}' không tìm thấy");
                    }
                }

                Guid? deptId = null;
                if (!string.IsNullOrWhiteSpace(deptCode))
                {
                    var dept = await _unitOfWork.Departments.GetAll()
                        .FirstOrDefaultAsync(d => d.DepartmentCode.Equals(deptCode, StringComparison.OrdinalIgnoreCase));
                    if (dept != null) deptId = dept.Id;
                    else
                    {
                        deptFound = false;
                        rowErrors.Add($"Phòng ban '{deptCode}' không tìm thấy");
                    }
                }

                if (rowErrors.Any())
                {
                    result.FailureCount++;
                    result.Errors.Add($"Dòng {row.RowNumber()}: {string.Join(", ", rowErrors)}.");
                    continue;
                }

                int capacity = 30;
                if (!int.TryParse(capacityStr, out capacity)) capacity = 30;

                RoomStatus status = RoomStatus.Available;
                if (Enum.TryParse<RoomStatus>(statusStr, true, out var parsedStatus))
                    status = parsedStatus;

                var room = new Room
                {
                    RoomCode = code!,
                    RoomName = name!,
                    Capacity = capacity,
                    Status = status,
                    RoomTypeId = typeId,
                    DepartmentId = deptId
                };

                await _unitOfWork.Rooms.AddAsync(room);
                processedCodes.Add(code!.ToLower());
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
        var worksheet = workbook.Worksheets.Add("Room Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Mã phòng";
        worksheet.Cell(1, 2).Value = "Tên phòng";
        worksheet.Cell(1, 3).Value = "Sức chứa";
        worksheet.Cell(1, 4).Value = "Trạng thái";
        worksheet.Cell(1, 5).Value = "Mã loại phòng";

        // Style
        var header = worksheet.Range("A1:E1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample
        worksheet.Cell(2, 1).Value = "A101";
        worksheet.Cell(2, 2).Value = "Phòng Lab 1";
        worksheet.Cell(2, 3).Value = 40;
        worksheet.Cell(2, 4).Value = "Available";
        worksheet.Cell(2, 5).Value = "Lab";

        worksheet.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }
}
