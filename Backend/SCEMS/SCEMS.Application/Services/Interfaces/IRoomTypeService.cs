using SCEMS.Application.DTOs.RoomType;

namespace SCEMS.Application.Services.Interfaces;

public interface IRoomTypeService
{
    Task<IEnumerable<RoomTypeDto>> GetAllAsync();
    Task<RoomTypeDto?> GetByIdAsync(Guid id);
    Task<RoomTypeDto> CreateAsync(CreateRoomTypeDto dto);
    Task<RoomTypeDto> UpdateAsync(Guid id, UpdateRoomTypeDto dto);
    Task DeleteAsync(Guid id);
}
