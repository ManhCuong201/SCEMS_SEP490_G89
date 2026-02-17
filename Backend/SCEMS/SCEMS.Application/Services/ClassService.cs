using AutoMapper;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Application.DTOs.Account;
using SCEMS.Application.DTOs.Class;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories;
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SCEMS.Application.Services;

public class ClassService : IClassService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ClassService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<List<ClassResponseDto>> GetClassesByLecturerAsync(Guid lecturerId)
    {
        var classes = await _unitOfWork.Classes.GetAll()
            .Where(c => c.LecturerId == lecturerId)
            .ToListAsync();
            
        return _mapper.Map<List<ClassResponseDto>>(classes);
    }

    public async Task<List<ClassResponseDto>> GetAllClassesAsync()
    {
        var classes = await _unitOfWork.Classes.GetAll()
            .ToListAsync();
            
        return _mapper.Map<List<ClassResponseDto>>(classes);
    }

    public async Task<ClassResponseDto?> GetClassByIdAsync(Guid id)
    {
        var @class = await _unitOfWork.Classes.GetByIdAsync(id);
        return @class != null ? _mapper.Map<ClassResponseDto>(@class) : null;
    }

    public async Task<List<EnrolledStudentDto>> GetClassStudentsAsync(Guid classId)
    {
        var enrolledStudents = await _unitOfWork.ClassStudents.GetAll()
            .Where(cs => cs.ClassId == classId)
            .Include(cs => cs.Student)
            .ToListAsync();

        var result = new List<EnrolledStudentDto>();

        foreach (var enrollment in enrolledStudents)
        {
            if (enrollment.Student != null)
            {
                result.Add(new EnrolledStudentDto
                {
                    Id = enrollment.Student.Id.ToString(),
                    FullName = enrollment.Student.FullName,
                    Email = enrollment.Student.Email,
                    StudentCode = enrollment.Student.StudentCode,
                    Status = enrollment.Student.Status.ToString()
                });
            }
            else if (!string.IsNullOrEmpty(enrollment.PendingStudentIdentifier))
            {
                result.Add(new EnrolledStudentDto
                {
                    Id = $"pending-{enrollment.PendingStudentIdentifier}",
                    FullName = "Pending Registration",
                    Email = enrollment.PendingStudentIdentifier.Contains("@") ? enrollment.PendingStudentIdentifier : string.Empty,
                    StudentCode = !enrollment.PendingStudentIdentifier.Contains("@") ? enrollment.PendingStudentIdentifier : string.Empty,
                    Status = "Pending"
                });
            }
        }

        return result;
    }

    public async Task<bool> ImportStudentsFromExcelAsync(Guid classId, Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

        foreach (var row in rows)
        {
            var studentIdentifier = row.Cell(1).GetValue<string>().Trim();
            if (string.IsNullOrEmpty(studentIdentifier)) continue;

            // Find student by Email or StudentCode
            var student = await _unitOfWork.Accounts.GetAll()
                .FirstOrDefaultAsync(a => a.Email == studentIdentifier || a.StudentCode == studentIdentifier);

            if (student != null)
            {
                // Check if already enrolled
                var exists = await _unitOfWork.ClassStudents.GetAll()
                    .AnyAsync(cs => cs.ClassId == classId && cs.StudentId == student.Id);

                if (!exists)
                {
                    await _unitOfWork.ClassStudents.AddAsync(new ClassStudent
                    {
                        ClassId = classId,
                        StudentId = student.Id
                    });
                }
            }
            else
            {
                // Student not found, add as pending
                var exists = await _unitOfWork.ClassStudents.GetAll()
                    .AnyAsync(cs => cs.ClassId == classId && cs.PendingStudentIdentifier == studentIdentifier);

                if (!exists)
                {
                    await _unitOfWork.ClassStudents.AddAsync(new ClassStudent
                    {
                        ClassId = classId,
                        StudentId = null,
                        PendingStudentIdentifier = studentIdentifier
                    });
                }
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<Stream> GetStudentImportTemplateAsync()
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.AddWorksheet("Students");
        worksheet.Cell(1, 1).Value = "Student Email or Code";
        
        // Add some styling to header
        var header = worksheet.Range("A1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;
        worksheet.Column(1).Width = 30;

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }

    public async Task LinkPendingEnrollmentsAsync(Guid studentId, string email, string? studentCode)
    {
        var pendingRecords = await _unitOfWork.ClassStudents.GetAll()
            .Where(cs => cs.StudentId == null && 
                        (cs.PendingStudentIdentifier == email || (studentCode != null && cs.PendingStudentIdentifier == studentCode)))
            .ToListAsync();

        if (pendingRecords.Any())
        {
            foreach (var record in pendingRecords)
            {
                record.StudentId = studentId;
                record.PendingStudentIdentifier = null; // Clear now that it's linked
                _unitOfWork.ClassStudents.Update(record);
            }
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
