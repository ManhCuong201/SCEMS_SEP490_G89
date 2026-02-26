namespace SCEMS.Application.Common;

public static class SlotHelper
{
    public static (TimeSpan StartTime, TimeSpan EndTime) GetSlotTimes(string slotType, int slotNumber)
    {
        bool isNew = string.Equals(slotType, "New", StringComparison.OrdinalIgnoreCase);
        if (isNew)
        {
            return slotNumber switch
            {
                1 => (new TimeSpan(7, 30, 0), new TimeSpan(9, 50, 0)),
                2 => (new TimeSpan(10, 0, 0), new TimeSpan(12, 20, 0)),
                3 => (new TimeSpan(12, 50, 0), new TimeSpan(15, 10, 0)),
                4 => (new TimeSpan(15, 20, 0), new TimeSpan(17, 40, 0)),
                5 => (new TimeSpan(18, 0, 0), new TimeSpan(20, 20, 0)),
                6 => (new TimeSpan(20, 0, 0), new TimeSpan(22, 20, 0)),
                _ => throw new ArgumentException($"Invalid New Slot Number: {slotNumber}. Must be 1-6.")
            };
        }
        else // Old
        {
            return slotNumber switch
            {
                1 => (new TimeSpan(7, 30, 0), new TimeSpan(9, 0, 0)),
                2 => (new TimeSpan(9, 10, 0), new TimeSpan(10, 40, 0)),
                3 => (new TimeSpan(10, 50, 0), new TimeSpan(12, 20, 0)),
                4 => (new TimeSpan(12, 50, 0), new TimeSpan(14, 20, 0)),
                5 => (new TimeSpan(14, 30, 0), new TimeSpan(16, 0, 0)),
                6 => (new TimeSpan(16, 10, 0), new TimeSpan(17, 40, 0)),
                7 => (new TimeSpan(18, 0, 0), new TimeSpan(19, 30, 0)),
                8 => (new TimeSpan(19, 45, 0), new TimeSpan(21, 15, 0)),
                _ => throw new ArgumentException($"Invalid Old Slot Number: {slotNumber}. Must be 1-8.")
            };
        }
    }
}
