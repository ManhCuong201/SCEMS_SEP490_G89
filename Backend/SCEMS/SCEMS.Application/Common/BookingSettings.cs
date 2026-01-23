namespace SCEMS.Application.Common;

public class BookingSettings
{
    public int StartHour { get; set; } = 7;
    public int EndHour { get; set; } = 22;
    public int SlotDurationMinutes { get; set; } = 60;
}
