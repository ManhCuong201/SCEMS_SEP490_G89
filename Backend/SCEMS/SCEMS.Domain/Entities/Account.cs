using SCEMS.Domain.Enums;

namespace SCEMS.Domain.Entities;

public class Account : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? StudentCode { get; set; } // FE ID
    public string? Phone { get; set; }
    public string? PasswordHash { get; set; }
    public AccountRole Role { get; set; }
    public AccountStatus Status { get; set; } = AccountStatus.Active;
    
    // Navigation properties will be added via fluent API or here
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
