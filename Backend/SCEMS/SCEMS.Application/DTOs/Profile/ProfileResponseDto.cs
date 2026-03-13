namespace SCEMS.Application.DTOs.Profile;

public class ProfileResponseDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? StudentCode { get; set; }
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
}
