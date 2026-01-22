using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.RoomCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.RoomName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(r => r.Capacity)
            .IsRequired();

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(r => r.RoomCode).IsUnique();

        builder.HasMany(r => r.Equipment)
            .WithOne(e => e.Room)
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Bookings)
            .WithOne(b => b.Room)
            .HasForeignKey(b => b.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.IssueReports)
            .WithOne(ir => ir.Room)
            .HasForeignKey(ir => ir.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(r => r.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(r => r.IsDeleted)
            .HasDefaultValue(false);
    }
}
