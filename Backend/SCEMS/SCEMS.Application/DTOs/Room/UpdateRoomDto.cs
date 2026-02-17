using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Room;

public class UpdateRoomDto
{
    [Required(ErrorMessage = "Room code is required")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Room code must be between 1 and 50 characters")]
    public string RoomCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Room name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Room name must be between 1 and 255 characters")]
    public string RoomName { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Building name cannot exceed 100 characters")]
    public string Building { get; set; } = string.Empty;

    [Required(ErrorMessage = "Capacity is required")]
    [Range(1, 10000, ErrorMessage = "Capacity must be between 1 and 10000")]
    public int Capacity { get; set; }

    public Guid? RoomTypeId { get; set; }
}
