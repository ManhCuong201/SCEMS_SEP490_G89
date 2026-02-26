using SCEMS.Application.Common;
using SCEMS.Application.DTOs.IssueReport;
using SCEMS.Domain.Enums;

namespace SCEMS.Application.Services.Interfaces;

public interface IIssueReportService
{
    Task<PaginatedResult<IssueReportResponseDto>> GetReportsAsync(PaginationParams @params, Guid? userId = null, IssueReportStatus? status = null);
    Task<IssueReportResponseDto?> GetReportByIdAsync(Guid id);
    Task<IssueReportResponseDto> CreateReportAsync(CreateIssueReportDto dto, Guid userId);
    Task<IssueReportResponseDto?> UpdateStatusAsync(Guid id, IssueReportStatus status);
}
