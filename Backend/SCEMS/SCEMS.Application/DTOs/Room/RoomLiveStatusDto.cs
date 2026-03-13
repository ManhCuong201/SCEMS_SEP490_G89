using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.Room;

public class RoomLiveStatusDto
{
    public Guid RoomId { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    
    public bool IsOccupied { get; set; }
    public string CurrentActivity { get; set; } = "Available"; // "Class", "Booking", "Maintenance", "Available"
    public string? Description { get; set; }
    public DateTime? ActivityEndTime { get; set; }
    public string? OccupiedBy { get; set; }
}
