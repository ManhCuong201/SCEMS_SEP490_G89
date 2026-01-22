using SCEMS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Account;

public class UpdateAccountDto
{
    [Required(ErrorMessage = "Full name is required")]
    [StringLength(255, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 255 characters")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email format is invalid")]
    public string Email { get; set; } = string.Empty;

    [StringLength(20, ErrorMessage = "Phone number must not exceed 20 characters")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Role is required")]
    public AccountRole Role { get; set; }
}
