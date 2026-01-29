using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Teaching_Schedule : BaseEntity
{
    public string Subject { get; set; } = string.Empty;
    public string ClassCode { get; set; } = string.Empty; // e.g., SE1701
    public string LecturerId { get; set; } = string.Empty; // Reference to external Lecturer ID or Name
    public string LecturerName { get; set; } = string.Empty;
    public string LecturerEmail { get; set; } = string.Empty;
    
    // Time info
    public DateTime Date { get; set; }
    public int Slot { get; set; } // 0-12
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
}
