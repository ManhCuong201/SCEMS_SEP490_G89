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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
