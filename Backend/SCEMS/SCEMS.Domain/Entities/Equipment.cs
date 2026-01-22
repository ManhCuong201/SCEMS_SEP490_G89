using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Equipment : BaseEntity
{
    public Guid EquipmentTypeId { get; set; }
    public Guid RoomId { get; set; }
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Working;

    public EquipmentType? EquipmentType { get; set; }
    public Room? Room { get; set; }
    public ICollection<IssueReport> IssueReports { get; set; } = new List<IssueReport>();
}
