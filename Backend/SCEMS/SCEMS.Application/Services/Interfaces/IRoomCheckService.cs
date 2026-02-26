using SCEMS.Application.DTOs.RoomCheck;
using SCEMS.Application.DTOs.IssueReport;

namespace SCEMS.Application.Services.Interfaces;

public interface IRoomCheckService
{
    Task<List<PendingRoomCheckDto>> GetPendingChecksAsync();
    Task<IssueReportResponseDto> CompleteCheckAsync(CompleteRoomCheckDto dto, Guid guardId);
}
