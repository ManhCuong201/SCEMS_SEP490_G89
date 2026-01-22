using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public interface IRoomRepository : IGenericRepository<Room>
{
    Task<Room?> GetByRoomCodeAsync(string roomCode);
}
