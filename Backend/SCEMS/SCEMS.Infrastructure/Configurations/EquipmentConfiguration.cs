using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.Configurations;

public class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
{
    public void Configure(EntityTypeBuilder<Equipment> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.EquipmentTypeId).IsRequired();
        builder.Property(e => e.RoomId).IsRequired();

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasOne(e => e.EquipmentType)
            .WithMany(et => et.Equipment)
            .HasForeignKey(e => e.EquipmentTypeId);

        builder.HasOne(e => e.Room)
            .WithMany(r => r.Equipment)
            .HasForeignKey(e => e.RoomId);

        builder.HasMany(e => e.IssueReports)
            .WithOne(ir => ir.Equipment)
            .HasForeignKey(ir => ir.EquipmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(e => e.IsDeleted)
            .HasDefaultValue(false);
    }
}
