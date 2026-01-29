using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ScemsDbContext _context;
    private IAccountRepository? _accountRepository;
    private IRoomRepository? _roomRepository;
    private IEquipmentTypeRepository? _equipmentTypeRepository;
    private IEquipmentRepository? _equipmentRepository;
    private IGenericRepository<Booking> _bookingRepository;
    private IGenericRepository<IssueReport> _issueReportRepository;
    private IGenericRepository<Teaching_Schedule> _teachingScheduleRepository;
    private IGenericRepository<Classroom_Status> _classroomStatusRepository;
    private IGenericRepository<Notification> _notificationRepository;
    private IGenericRepository<Booking_History> _bookingHistoryRepository;
    private IClassRepository? _classRepository;
    private IClassStudentRepository? _classStudentRepository;
    private IGenericRepository<RoomType>? _roomTypeRepository;
    public UnitOfWork(ScemsDbContext context)
    {
        _context = context;
    }

    public IAccountRepository Accounts
    {
        get { return _accountRepository ??= new AccountRepository(_context); }
    }

    public IRoomRepository Rooms
    {
        get { return _roomRepository ??= new RoomRepository(_context); }
    }

    public IEquipmentTypeRepository EquipmentTypes
    {
        get { return _equipmentTypeRepository ??= new EquipmentTypeRepository(_context); }
    }

    public IEquipmentRepository Equipment
    {
        get { return _equipmentRepository ??= new EquipmentRepository(_context); }
    }

    public IGenericRepository<Booking> Bookings
    {
        get { return _bookingRepository ??= new GenericRepository<Booking>(_context); }
    }

    public IGenericRepository<IssueReport> IssueReports
    {
        get { return _issueReportRepository ??= new GenericRepository<IssueReport>(_context); }
    }

    public IGenericRepository<Teaching_Schedule> TeachingSchedules
    {
        get { return _teachingScheduleRepository ??= new GenericRepository<Teaching_Schedule>(_context); }
    }

    public IGenericRepository<Classroom_Status> ClassroomStatuses
    {
        get { return _classroomStatusRepository ??= new GenericRepository<Classroom_Status>(_context); }
    }

    public IGenericRepository<Notification> Notifications
    {
        get { return _notificationRepository ??= new GenericRepository<Notification>(_context); }
    }

    public IGenericRepository<Booking_History> BookingHistories
    {
        get { return _bookingHistoryRepository ??= new GenericRepository<Booking_History>(_context); }
    }

    public IClassRepository Classes
    {
        get { return _classRepository ??= new ClassRepository(_context); }
    }

    public IClassStudentRepository ClassStudents
    {
        get { return _classStudentRepository ??= new ClassStudentRepository(_context); }
    }

    public IGenericRepository<RoomType> RoomTypes
    {
        get { return _roomTypeRepository ??= new GenericRepository<RoomType>(_context); }
    }
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
