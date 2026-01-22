using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.RoomId).IsRequired();
        builder.Property(b => b.RequestedBy).IsRequired();
        builder.Property(b => b.TimeSlot).IsRequired();
        builder.Property(b => b.Duration).IsRequired();

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasOne(b => b.Room)
            .WithMany(r => r.Bookings)
            .HasForeignKey(b => b.RoomId);

        builder.HasOne(b => b.RequestedByAccount)
            .WithMany()
            .HasForeignKey(b => b.RequestedBy);

        builder.Property(b => b.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(b => b.IsDeleted)
            .HasDefaultValue(false);
    }
}
