using SCEMS.Application.DTOs.Room;
using SCEMS.Application.DTOs.Account;
using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.Booking;

public class BookingResponseDto
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid RequestedBy { get; set; }
    public DateTime TimeSlot { get; set; }
    public DateTime EndTime { get; set; } // Add precise end time
    public int Duration { get; set; }
    public string? Reason { get; set; }
    public string BookingStatus { get; set; } // Rename or map enum string? The DTO has 'Status' enum type usually.
    // Wait, previous file content showed `public BookingStatus Status { get; set; }`
    public string Status { get; set; } // Keeping string is flexible for "Approved" vs custom.
    // Actually typically DTO uses string for Enums to be JSON friendly or Enum type. 
    // The previous file had `public BookingStatus Status`. Let's keep it but add String version if needed.
    // Or just use `string` if I assigned `BookingStatus.Approved.ToString()` in Service. 
    // Service code: `Status = BookingStatus.Approved.ToString()` -> implies DTO Status is string?
    // Let's check Service code again. 
    // Service: `Status = BookingStatus.Approved.ToString()` 
    // DTO: `public BookingStatus Status { get; set; }` -> Type mismatch error!
    
    // I need to change DTO Status to string OR change Service to use Enum.
    // Changing DTO to string is safer for "virtual" bookings like classes.
    
    public DateTime CreatedAt { get; set; }

    // Flattened props for easier UI
    public string? RoomName { get; set; }
    public string? RequestedByName { get; set; }
    
    public RoomResponseDto Room { get; set; } = null!;
    public AccountResponseDto RequestedByAccount { get; set; } = null!;
}
