using RoomManagementAPI.Models;

namespace RoomManagementAPI.Business
{
    public interface IRoomService
    {
        Task<IEnumerable<Room>> GetAllRoomsAsync();
        Task<Room> GetRoomByIdAsync(int id);
        Task<Room> CreateRoomAsync(Room room);
        Task<Room> UpdateRoomAsync(int id, Room room);
        Task<bool> DeleteRoomAsync(int id);
    }
}
