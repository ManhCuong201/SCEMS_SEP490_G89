using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Classroom_Status : BaseEntity
{
    public Guid RoomId { get; set; }
    public bool IsOccupied { get; set; }
    public bool IsLocked { get; set; }
    public string? CurrentClassCode { get; set; }
    public DateTime LastUpdated { get; set; }

    public Room? Room { get; set; }
}
