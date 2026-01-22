using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.EquipmentType;

public class EquipmentTypeResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EquipmentTypeStatus Status { get; set; }
    public int EquipmentCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
