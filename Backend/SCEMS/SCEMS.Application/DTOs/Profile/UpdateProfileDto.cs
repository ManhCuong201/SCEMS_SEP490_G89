using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Profile;

public class UpdateProfileDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    
    public string? Phone { get; set; }
}
