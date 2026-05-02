using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Booking;

public class CreateBookingDto
{
    [Required]
    public Guid RoomId { get; set; }

    [Required]
    public DateTime TimeSlot { get; set; }

    [Required]
    public double Duration { get; set; } = 1;

    [Required(ErrorMessage = "Vui lòng nhập lý do mượn phòng.")]
    public string Reason { get; set; } = string.Empty;
}
