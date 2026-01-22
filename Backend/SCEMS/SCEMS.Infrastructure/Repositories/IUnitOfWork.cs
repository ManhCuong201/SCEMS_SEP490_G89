using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public interface IUnitOfWork : IDisposable
{
    IAccountRepository Accounts { get; }
    IRoomRepository Rooms { get; }
    IEquipmentTypeRepository EquipmentTypes { get; }
    IEquipmentRepository Equipment { get; }
    IGenericRepository<SCEMS.Domain.Entities.Booking> Bookings { get; }
    IGenericRepository<SCEMS.Domain.Entities.IssueReport> IssueReports { get; }

    Task SaveChangesAsync();
}
