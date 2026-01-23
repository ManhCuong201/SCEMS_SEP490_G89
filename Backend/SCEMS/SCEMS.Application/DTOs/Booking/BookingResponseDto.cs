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
    public int Duration { get; set; }
    public string? Reason { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public RoomResponseDto Room { get; set; } = null!;
    public AccountResponseDto RequestedByAccount { get; set; } = null!;
}
