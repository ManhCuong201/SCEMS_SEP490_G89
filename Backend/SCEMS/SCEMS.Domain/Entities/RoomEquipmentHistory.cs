using SCEMS.Domain.Enums;
using System;

namespace SCEMS.Domain.Entities;

public class RoomEquipmentHistory : BaseEntity
{
    public Guid EquipmentId { get; set; }
    public Guid RoomId { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? UnassignedAt { get; set; }
    public string? Notes { get; set; }

    public Equipment? Equipment { get; set; }
    public Room? Room { get; set; }
}
