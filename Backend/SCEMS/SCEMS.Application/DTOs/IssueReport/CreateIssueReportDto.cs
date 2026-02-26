using System.ComponentModel.DataAnnotations;

namespace SCEMS.Application.DTOs.IssueReport;

public class CreateIssueReportDto
{
    public Guid? RoomId { get; set; }
    public Guid? EquipmentId { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;
}
