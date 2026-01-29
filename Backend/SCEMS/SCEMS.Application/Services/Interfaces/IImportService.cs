using SCEMS.Application.DTOs.Import;

namespace SCEMS.Application.Services.Interfaces;

public interface IImportService
{
    Task<ImportResultDto> ImportAccountsAsync(Stream fileStream);
    Task<ImportResultDto> ImportTeachingScheduleAsync(Stream fileStream);
    Task<Stream> GetAccountTemplateStreamAsync();
    Task<Stream> GetTeachingScheduleTemplateStreamAsync();
}
