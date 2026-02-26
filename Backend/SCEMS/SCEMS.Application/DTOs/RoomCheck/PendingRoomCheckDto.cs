namespace SCEMS.Application.DTOs.RoomCheck;

public class PendingRoomCheckDto
{
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string RoomCode { get; set; } = string.Empty;
    public DateTime LastActivityEndTime { get; set; }
}
