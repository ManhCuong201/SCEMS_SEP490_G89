using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Booking;

public class CreateRoomChangeRequestDto
{
    [Required]
    public Guid OriginalRoomId { get; set; }
    
    [Required]
    public Guid NewRoomId { get; set; }
    
    [Required]
    public DateTime TimeSlot { get; set; } // The time of the class
    
    [Required]
    public int Duration { get; set; } // Duration in hours (or slots)
    
    [Required]
    public string Reason { get; set; } = string.Empty;
}
