using SCEMS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Equipment;

public class UpdateEquipmentDto
{
    [StringLength(100, ErrorMessage = "Tên thiết bị không được vượt quá 100 ký tự")]
    public string? Name { get; set; }
    public Guid? RoomId { get; set; }
    public EquipmentStatus? Status { get; set; }
    public string? Note { get; set; }
}
