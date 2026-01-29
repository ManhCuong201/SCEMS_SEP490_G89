using Microsoft.EntityFrameworkCore;
using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.DbContext;

public class ScemsDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    public ScemsDbContext(DbContextOptions<ScemsDbContext> options) : base(options) { }

    public DbSet<Account> Accounts { get; set; } = null!;
    public DbSet<Room> Rooms { get; set; } = null!;
    public DbSet<EquipmentType> EquipmentTypes { get; set; } = null!;
    public DbSet<Equipment> Equipment { get; set; } = null!;
    public DbSet<Booking> Bookings { get; set; } = null!;
    public DbSet<IssueReport> IssueReports { get; set; } = null!;
    public DbSet<RoomType> RoomTypes { get; set; } = null!;

    // New Entities
    public DbSet<Teaching_Schedule> TeachingSchedules { get; set; } = null!;
    public DbSet<Classroom_Status> ClassroomStatuses { get; set; } = null!;
    public DbSet<Booking_History> BookingHistories { get; set; } = null!;
    public DbSet<Equipment_Report> EquipmentReports { get; set; } = null!;
    public DbSet<Classroom_Report> ClassroomReports { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<System_Configuration> SystemConfigurations { get; set; } = null!;
    public DbSet<Class> Classes { get; set; } = null!;
    public DbSet<ClassStudent> ClassStudents { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Relationships
        modelBuilder.Entity<Class>()
            .HasOne(c => c.Lecturer)
            .WithMany()
            .HasForeignKey(c => c.LecturerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure RoomType Cascade
        modelBuilder.Entity<Room>()
            .HasOne(r => r.RoomType)
            .WithMany(rt => rt.Rooms)
            .HasForeignKey(r => r.RoomTypeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClassStudent>()
            .HasOne(cs => cs.Class)
            .WithMany(c => c.EnrolledStudents)
            .HasForeignKey(cs => cs.ClassId);

        modelBuilder.Entity<ClassStudent>()
            .HasOne(cs => cs.Student)
            .WithMany()
            .HasForeignKey(cs => cs.StudentId);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ScemsDbContext).Assembly);

        var deletableEntityTypes = modelBuilder.Model.GetEntityTypes()
            .Where(t => typeof(BaseEntity).IsAssignableFrom(t.ClrType));

        foreach (var entityType in deletableEntityTypes)
        {
            var method = typeof(ScemsDbContext)
                .GetMethod(nameof(ConfigureIsDeletedQueryFilter))!
                .MakeGenericMethod(entityType.ClrType);

            method.Invoke(this, new object[] { modelBuilder });
        }
    }

    public void ConfigureIsDeletedQueryFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : BaseEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => !e.IsDeleted);
    }
}
