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
    private IGenericRepository<Booking>? _bookingRepository;
    private IGenericRepository<IssueReport>? _issueReportRepository;

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

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
