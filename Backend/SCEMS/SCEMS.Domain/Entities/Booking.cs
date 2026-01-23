using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Booking : BaseEntity
{
    public Guid RoomId { get; set; }
    public Guid RequestedBy { get; set; }
    public DateTime TimeSlot { get; set; }
    public int Duration { get; set; }
    public string? Reason { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    public Room? Room { get; set; }
    public Account? RequestedByAccount { get; set; }
}
