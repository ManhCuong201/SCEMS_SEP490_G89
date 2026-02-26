using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.IssueReport;

public class IssueReportResponseDto
{
    public Guid Id { get; set; }
    public Guid CreatedBy { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    
    public Guid? RoomId { get; set; }
    public string? RoomName { get; set; }
    
    public Guid? EquipmentId { get; set; }
    public string? EquipmentName { get; set; }
    
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
