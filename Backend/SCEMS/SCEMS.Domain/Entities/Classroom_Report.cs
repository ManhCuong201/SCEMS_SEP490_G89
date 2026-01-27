using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Classroom_Report : BaseEntity
{
    public Guid RoomId { get; set; }
    public string IssueDescription { get; set; } = string.Empty;
    public IssueReportStatus Status { get; set; } = IssueReportStatus.Open;
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public Guid ReportedBy { get; set; } // AccountId

    public Room? Room { get; set; }
    public Account? ReportedByAccount { get; set; }
}
