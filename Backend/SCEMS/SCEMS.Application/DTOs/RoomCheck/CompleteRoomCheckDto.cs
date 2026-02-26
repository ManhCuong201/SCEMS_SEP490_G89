using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.RoomCheck;

public class CompleteRoomCheckDto
{
    [Required]
    public Guid RoomId { get; set; }
    public string? Note { get; set; }
}
