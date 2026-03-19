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
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; }

    // Flattened props for easier UI
    public string? RoomName { get; set; }
    public string? RequestedByName { get; set; }
    
    public RoomResponseDto Room { get; set; } = null!;
    public AccountResponseDto RequestedByAccount { get; set; } = null!;
}
