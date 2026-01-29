using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.Account;

public class AccountResponseDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public AccountRole Role { get; set; }
    public string? StudentCode { get; set; }
    public AccountStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
