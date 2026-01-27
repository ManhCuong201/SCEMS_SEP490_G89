using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Equipment_Report : BaseEntity
{
    public Guid EquipmentId { get; set; }
    public string IssueDescription { get; set; } = string.Empty;
    public IssueReportStatus Status { get; set; } = IssueReportStatus.Open; // e.g. Open, InProgress, Resolved
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public Guid ReportedBy { get; set; } // AccountId

    public Equipment? Equipment { get; set; }
    public Account? ReportedByAccount { get; set; }
}
