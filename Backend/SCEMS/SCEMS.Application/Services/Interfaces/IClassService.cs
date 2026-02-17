using SCEMS.Application.DTOs.Account;
using SCEMS.Application.DTOs.Class;
using System.IO;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SCEMS.Application.Services.Interfaces;

public interface IClassService
{
    Task<List<ClassResponseDto>> GetClassesByLecturerAsync(Guid lecturerId);
    Task<ClassResponseDto?> GetClassByIdAsync(Guid id);
    Task<List<EnrolledStudentDto>> GetClassStudentsAsync(Guid classId);
    Task<bool> ImportStudentsFromExcelAsync(Guid classId, Stream fileStream);
    Task<Stream> GetStudentImportTemplateAsync();
    Task<List<ClassResponseDto>> GetAllClassesAsync();
    Task LinkPendingEnrollmentsAsync(Guid studentId, string email, string? studentCode);
}
