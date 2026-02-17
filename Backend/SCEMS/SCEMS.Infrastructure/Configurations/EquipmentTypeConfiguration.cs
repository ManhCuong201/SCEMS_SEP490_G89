using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.Configurations;

public class EquipmentTypeConfiguration : IEntityTypeConfiguration<EquipmentType>
{
    public void Configure(EntityTypeBuilder<EquipmentType> builder)
    {
        builder.HasKey(et => et.Id);

        builder.Property(et => et.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(et => et.Description)
            .HasMaxLength(500);

        builder.Property(et => et.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(et => et.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(et => et.Name).IsUnique();
        builder.HasIndex(et => et.Code).IsUnique();

        builder.HasMany(et => et.Equipment)
            .WithOne(e => e.EquipmentType)
            .HasForeignKey(e => e.EquipmentTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(et => et.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

        builder.Property(et => et.IsDeleted)
            .HasDefaultValue(false);
    }
}
