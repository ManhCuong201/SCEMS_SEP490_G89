using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Infrastructure.Repositories;

public interface IUnitOfWork : IDisposable
{
    IAccountRepository Accounts { get; }
    IRoomRepository Rooms { get; }
    IEquipmentTypeRepository EquipmentTypes { get; }
    IGenericRepository<SCEMS.Domain.Entities.Equipment> Equipment { get; }
    IGenericRepository<SCEMS.Domain.Entities.Booking> Bookings { get; }
    IGenericRepository<SCEMS.Domain.Entities.IssueReport> IssueReports { get; }

    Task SaveChangesAsync();
}
