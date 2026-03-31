using SCEMS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Equipment;

public class CreateEquipmentDto
{
    [Required(ErrorMessage = "Tên thiết bị là bắt buộc")]
    [StringLength(100, ErrorMessage = "Tên thiết bị không được vượt quá 100 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Loại thiết bị là bắt buộc")]
    public Guid EquipmentTypeId { get; set; }

    [Required]
    public Guid RoomId { get; set; }

    public EquipmentStatus Status { get; set; } = EquipmentStatus.Working;
}
