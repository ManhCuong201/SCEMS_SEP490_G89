using System.ComponentModel.DataAnnotations;
using SCEMS.Domain.Enums;

namespace SCEMS.Application.DTOs.IssueReport;

public class UpdateIssueReportStatusDto
{
    [Required]
    public IssueReportStatus Status { get; set; }
}
