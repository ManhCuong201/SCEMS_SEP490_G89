using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.Schedule;

public class ImportScheduleDto
{
    [Required]
    public string SubjectCode { get; set; } = string.Empty;

    [Required]
    public string ClassCode { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    public string DayOfWeek { get; set; } = string.Empty; // e.g., "Monday", "Tuesday" or "Mon", "Tue"

    [Required]
    public string StartTime { get; set; } = string.Empty; // e.g. "07:30"

    [Required]
    public string EndTime { get; set; } = string.Empty; // e.g. "09:50"

    public string? RoomName { get; set; } // Optional: will try to auto-assign if missing
}

public class ScheduleResponseDto
{
    public Guid Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string ClassCode { get; set; } = string.Empty;
    public string LecturerName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int Slot { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
}
