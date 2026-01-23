using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Booking;

public class CreateBookingDto
{
    [Required]
    public Guid RoomId { get; set; }

    [Required]
    public DateTime TimeSlot { get; set; }

    [Required]
    public int Duration { get; set; } = 1;

    public string? Reason { get; set; }
}
