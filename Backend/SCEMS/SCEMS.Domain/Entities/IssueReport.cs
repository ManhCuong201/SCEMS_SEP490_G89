using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class IssueReport : BaseEntity
{
    public Guid CreatedBy { get; set; }
    public Guid? RoomId { get; set; }
    public Guid? EquipmentId { get; set; }
    public string Description { get; set; } = string.Empty;
    public IssueReportStatus Status { get; set; } = IssueReportStatus.Open;

    public Account? CreatedByAccount { get; set; }
    public Room? Room { get; set; }
    public Equipment? Equipment { get; set; }
}
