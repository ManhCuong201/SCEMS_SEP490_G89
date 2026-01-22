using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.Configurations;

public class IssueReportConfiguration : IEntityTypeConfiguration<IssueReport>
{
    public void Configure(EntityTypeBuilder<IssueReport> builder)
    {
        builder.HasKey(ir => ir.Id);

        builder.Property(ir => ir.CreatedBy).IsRequired();
        builder.Property(ir => ir.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(ir => ir.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasOne(ir => ir.CreatedByAccount)
            .WithMany()
            .HasForeignKey(ir => ir.CreatedBy);

        builder.HasOne(ir => ir.Room)
            .WithMany(r => r.IssueReports)
            .HasForeignKey(ir => ir.RoomId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(ir => ir.Equipment)
            .WithMany(e => e.IssueReports)
            .HasForeignKey(ir => ir.EquipmentId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(ir => ir.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(ir => ir.IsDeleted)
            .HasDefaultValue(false);
    }
}
