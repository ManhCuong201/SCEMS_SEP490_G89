using Microsoft.EntityFrameworkCore;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public class RoomRepository : GenericRepository<Room>, IRoomRepository
{
    public RoomRepository(ScemsDbContext context) : base(context) { }

    public async Task<Room?> GetByRoomCodeAsync(string roomCode)
    {
        return await _context.Rooms.FirstOrDefaultAsync(r => r.RoomCode == roomCode);
    }
}
