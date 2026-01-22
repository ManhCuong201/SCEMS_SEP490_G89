using RoomManagementAPI.Data;
using RoomManagementAPI.Models;

namespace RoomManagementAPI.Business
{
    public class RoomService : IRoomService
    {
        private readonly IRepository<Room> _roomRepository;

        public RoomService(IRepository<Room> roomRepository)
        {
            _roomRepository = roomRepository;
        }

        public async Task<IEnumerable<Room>> GetAllRoomsAsync()
        {
            return await _roomRepository.GetAllAsync();
        }

        public async Task<Room> GetRoomByIdAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid room id");

            var room = await _roomRepository.GetByIdAsync(id);
            if (room == null)
                throw new KeyNotFoundException($"Room with id {id} not found");

            return room;
        }

        public async Task<Room> CreateRoomAsync(Room room)
        {
            if (room == null)
                throw new ArgumentNullException(nameof(room));

            if (string.IsNullOrWhiteSpace(room.RoomName))
                throw new ArgumentException("Room name is required");

            if (room.Capacity <= 0)
                throw new ArgumentException("Capacity must be greater than 0");

            return await _roomRepository.AddAsync(room);
        }

        public async Task<Room> UpdateRoomAsync(int id, Room room)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid room id");

            var exists = await _roomRepository.ExistsAsync(id);
            if (!exists)
                throw new KeyNotFoundException($"Room with id {id} not found");

            room.Id = id;
            return await _roomRepository.UpdateAsync(room);
        }

        public async Task<bool> DeleteRoomAsync(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid room id");

            var exists = await _roomRepository.ExistsAsync(id);
            if (!exists)
                throw new KeyNotFoundException($"Room with id {id} not found");

            return await _roomRepository.DeleteAsync(id);
        }
    }
}
