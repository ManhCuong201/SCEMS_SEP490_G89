using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.Equipment;

public class EquipmentResponseDto
{
    public Guid Id { get; set; }
    public Guid EquipmentTypeId { get; set; }
    public string EquipmentTypeName { get; set; } = string.Empty;
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
