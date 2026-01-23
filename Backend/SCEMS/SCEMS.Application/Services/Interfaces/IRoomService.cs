using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Room;

namespace SCEMS.Application.Services.Interfaces;

public interface IRoomService
{
    Task<PaginatedRoomsDto> GetRoomsAsync(PaginationParams @params);
    Task<RoomResponseDto?> GetRoomByIdAsync(Guid id);
    Task<RoomResponseDto> CreateRoomAsync(CreateRoomDto dto);
    Task<RoomResponseDto?> UpdateRoomAsync(Guid id, UpdateRoomDto dto);
    Task<bool> DeleteRoomAsync(Guid id);
    Task<bool> UpdateStatusAsync(Guid id, int status);
    Task<int> ImportRoomAsync(Stream stream);
    Task<Stream> GetTemplateStreamAsync();
}
