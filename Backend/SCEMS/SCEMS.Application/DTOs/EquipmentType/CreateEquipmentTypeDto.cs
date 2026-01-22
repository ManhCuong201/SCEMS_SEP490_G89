using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.EquipmentType;

public class CreateEquipmentTypeDto
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 255 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    public string? Description { get; set; }
}
