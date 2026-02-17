using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.Configurations;

public class RoomTypeConfiguration : IEntityTypeConfiguration<RoomType>
{
    public void Configure(EntityTypeBuilder<RoomType> builder)
    {
        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(rt => rt.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(rt => rt.Description)
            .HasMaxLength(500);

        builder.HasIndex(rt => rt.Name).IsUnique();
        builder.HasIndex(rt => rt.Code).IsUnique();

        builder.HasMany(rt => rt.Rooms)
            .WithOne(r => r.RoomType)
            .HasForeignKey(r => r.RoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(rt => rt.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

        builder.Property(rt => rt.IsDeleted)
            .HasDefaultValue(false);
    }
}
