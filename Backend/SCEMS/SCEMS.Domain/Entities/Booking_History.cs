using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Booking_History : BaseEntity
{
    public Guid BookingId { get; set; }
    public BookingStatus PreviousStatus { get; set; }
    public BookingStatus NewStatus { get; set; }
    public DateTime ChangedAt { get; set; }
    public Guid ChangedBy { get; set; } // AccountId
    public string? Reason { get; set; }

    public Booking? Booking { get; set; }
    public Account? ChangedByAccount { get; set; }
}
