using SCEMS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Equipment;

public class CreateEquipmentDto
{
    [Required]
    public Guid EquipmentTypeId { get; set; }

    [Required]
    public Guid RoomId { get; set; }

    public EquipmentStatus Status { get; set; } = EquipmentStatus.Working;
}
