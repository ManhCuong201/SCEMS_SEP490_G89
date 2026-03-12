using SCEMS.Application.DTOs.Schedule;
using SCEMS.Application.DTOs.Import;

namespace SCEMS.Application.Services.Interfaces;

public interface ITeachingScheduleService
{
    Task<List<ScheduleResponseDto>> GetMyScheduleAsync(Guid userId, DateTime start, DateTime end, string? classCode = null);
    Task<List<ScheduleResponseDto>> GetSchedulesByDateAsync(DateTime date);
    Task<ImportResultDto> ImportScheduleAsync(Stream excelStream, Guid lecturerId);
    Task<List<ScheduleResponseDto>> GetAllSchedulesAsync(DateTime start, DateTime end);
    Task<byte[]> GetImportTemplateAsync();
}
