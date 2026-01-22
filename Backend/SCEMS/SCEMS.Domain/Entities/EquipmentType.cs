using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class EquipmentType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EquipmentTypeStatus Status { get; set; } = EquipmentTypeStatus.Active;

    public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
}
