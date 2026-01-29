using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.Room;

public class RoomResponseDto
{
    public Guid Id { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public RoomStatus Status { get; set; }
    public int PendingRequestsCount { get; set; }
    public int EquipmentCount { get; set; }
    public Guid? RoomTypeId { get; set; }
    public string? RoomTypeName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
