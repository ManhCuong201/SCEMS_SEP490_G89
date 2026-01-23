using SCEMS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Equipment;

public class UpdateEquipmentDto
{
    public string? Name { get; set; }
    public Guid? RoomId { get; set; }

    public EquipmentStatus? Status { get; set; }
}
