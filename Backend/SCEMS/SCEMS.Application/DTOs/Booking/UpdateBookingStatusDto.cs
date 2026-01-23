using SCEMS.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Booking;

public class UpdateBookingStatusDto
{
    [Required]
    public BookingStatus Status { get; set; }
}
