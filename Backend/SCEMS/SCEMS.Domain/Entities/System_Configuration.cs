namespace SCEMS.Domain.Entities;

public class System_Configuration : BaseEntity
{
    public string Key { get; set; } = string.Empty; // e.g. "BookingWindowDays"
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
