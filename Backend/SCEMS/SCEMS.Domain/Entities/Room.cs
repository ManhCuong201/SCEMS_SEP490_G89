using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Room : BaseEntity
{
    public string RoomCode { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Available;

    public Guid? RoomTypeId { get; set; }
    public RoomType? RoomType { get; set; }

    public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<IssueReport> IssueReports { get; set; } = new List<IssueReport>();
}
