using SCEMS.Application.DTOs.Schedule;

namespace SCEMS.Application.Services.Interfaces;

public interface ITeachingScheduleService
{
    Task<List<ScheduleResponseDto>> GetMyScheduleAsync(Guid userId, DateTime start, DateTime end, string? classCode = null);
    Task<string> ImportScheduleAsync(Stream excelStream, Guid lecturerId);
    Task<byte[]> GetImportTemplateAsync();
}
