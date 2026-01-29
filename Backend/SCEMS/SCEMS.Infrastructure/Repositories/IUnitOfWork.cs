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
    IGenericRepository<SCEMS.Domain.Entities.Teaching_Schedule> TeachingSchedules { get; }
    IGenericRepository<SCEMS.Domain.Entities.Classroom_Status> ClassroomStatuses { get; }
    IGenericRepository<SCEMS.Domain.Entities.Notification> Notifications { get; }
    IGenericRepository<SCEMS.Domain.Entities.Booking_History> BookingHistories { get; }
    IClassRepository Classes { get; }
    IClassStudentRepository ClassStudents { get; }

    Task SaveChangesAsync();
}
