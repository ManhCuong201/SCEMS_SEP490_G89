using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Booking;

public class CreateScheduleChangeRequestDto
{
    [Required]
    public Guid ScheduleId { get; set; }

    [Required]
    public Guid NewRoomId { get; set; }

    [Required]
    public DateTime NewDate { get; set; }

    [Required]
    public string SlotType { get; set; } = "New"; // "Old" or "New"

    [Required]
    [Range(1, 8)]
    public int NewSlot { get; set; }

    [Required]
    public string Reason { get; set; } = string.Empty;
}
