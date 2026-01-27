namespace SCEMS.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid RecipientId { get; set; } // AccountId
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public string? Link { get; set; } // Optional: action link

    public Account? Recipient { get; set; }
}
