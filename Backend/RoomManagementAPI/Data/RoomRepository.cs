using RoomManagementAPI.Models;

namespace RoomManagementAPI.Data
{
    public class RoomRepository : IRepository<Room>
    {
        // Simulated in-memory database. Replace with actual DbContext for real implementation
        private static List<Room> _rooms = new()
        {
            new Room { Id = 1, RoomName = "Conference Room A", RoomNumber = "A101", Capacity = 10, Location = "Floor 1", Status = "Available", CreatedDate = DateTime.Now, UpdatedDate = DateTime.Now },
            new Room { Id = 2, RoomName = "Meeting Room B", RoomNumber = "B102", Capacity = 6, Location = "Floor 2", Status = "Occupied", CreatedDate = DateTime.Now, UpdatedDate = DateTime.Now }
        };

        public Task<IEnumerable<Room>> GetAllAsync()
        {
            return Task.FromResult(_rooms.AsEnumerable());
        }

        public Task<Room?> GetByIdAsync(int id)
        {
            var room = _rooms.FirstOrDefault(r => r.Id == id);
            return Task.FromResult(room);
        }

        public Task<Room> AddAsync(Room entity)
        {
            entity.Id = _rooms.Max(r => r.Id) + 1;
            entity.CreatedDate = DateTime.Now;
            entity.UpdatedDate = DateTime.Now;
            _rooms.Add(entity);
            return Task.FromResult(entity);
        }

        public Task<Room?> UpdateAsync(Room entity)
        {
            var existingRoom = _rooms.FirstOrDefault(r => r.Id == entity.Id);
            if (existingRoom != null)
            {
                existingRoom.RoomName = entity.RoomName;
                existingRoom.RoomNumber = entity.RoomNumber;
                existingRoom.Capacity = entity.Capacity;
                existingRoom.Location = entity.Location;
                existingRoom.Status = entity.Status;
                existingRoom.UpdatedDate = DateTime.Now;
            }
            return Task.FromResult(existingRoom);
        }

        public Task<bool> DeleteAsync(int id)
        {
            var room = _rooms.FirstOrDefault(r => r.Id == id);
            if (room != null)
            {
                _rooms.Remove(room);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> ExistsAsync(int id)
        {
            return Task.FromResult(_rooms.Any(r => r.Id == id));
        }
    }
}
