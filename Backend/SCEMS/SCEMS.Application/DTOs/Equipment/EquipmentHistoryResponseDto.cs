namespace SCEMS.Application.DTOs.Equipment;

public class EquipmentHistoryResponseDto
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string RoomCode { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? UnassignedAt { get; set; }
    public string? Notes { get; set; }
}
