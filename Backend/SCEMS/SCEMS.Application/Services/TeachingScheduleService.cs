using AutoMapper;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.DTOs.Schedule;
using SCEMS.Application.DTOs.Import;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class TeachingScheduleService : ITeachingScheduleService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IImportService _importService;

    public TeachingScheduleService(IUnitOfWork unitOfWork, IMapper mapper, IImportService importService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _importService = importService;
    }

    public async Task<List<ScheduleResponseDto>> GetMyScheduleAsync(Guid userId, DateTime start, DateTime end, string? classCode = null)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
        if (account == null) return new List<ScheduleResponseDto>();

        IQueryable<Teaching_Schedule> query = _unitOfWork.TeachingSchedules.GetAll()
            .Include(ts => ts.Room)
            .Where(ts => ts.Date >= start.Date && ts.Date <= end.Date);

        if (account.Role == AccountRole.Lecturer)
        {
            query = query.Where(ts => ts.LecturerId == userId.ToString() || ts.LecturerName == account.FullName);
        }
        else if (account.Role == AccountRole.Student)
        {
            if (!string.IsNullOrEmpty(classCode))
            {
                query = query.Where(ts => ts.ClassCode == classCode);
            }
            else
            {
                // Auto-resolve student's enrolled classes
                var enrolledClassCodes = await _unitOfWork.ClassStudents.GetAll()
                    .Where(cs => cs.StudentId == userId)
                    .Include(cs => cs.Class)
                    .Select(cs => cs.Class != null ? cs.Class.ClassCode : cs.PendingStudentIdentifier)
                    .Where(c => c != null)
                    .ToListAsync();

                if (enrolledClassCodes.Any())
                {
                    query = query.Where(ts => enrolledClassCodes.Contains(ts.ClassCode));
                }
                else
                {
                    return new List<ScheduleResponseDto>();
                }
            }
        }

        var schedules = await query.OrderBy(ts => ts.Date).ThenBy(ts => ts.Slot).ToListAsync();
        return _mapper.Map<List<ScheduleResponseDto>>(schedules);
    }

    public async Task<List<ScheduleResponseDto>> GetAllSchedulesAsync(DateTime start, DateTime end)
    {
        var schedules = await _unitOfWork.TeachingSchedules.GetAll()
            .AsNoTracking()
            .Include(ts => ts.Room)
            .Where(ts => ts.Date >= start.Date && ts.Date <= end.Date)
            .OrderBy(ts => ts.Date).ThenBy(ts => ts.Slot)
            .ToListAsync();

        return _mapper.Map<List<ScheduleResponseDto>>(schedules);
    }

    public async Task<byte[]> GetImportTemplateAsync()
    {
        using var stream = await _importService.GetTeachingScheduleTemplateStreamAsync();
        if (stream is MemoryStream ms)
        {
            return ms.ToArray();
        }
        
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        return memoryStream.ToArray();
    }

    public async Task<ImportResultDto> ImportScheduleAsync(Stream excelStream, Guid currentUserId)
    {
        return await _importService.ImportTeachingScheduleAsync(excelStream);
    }

    public async Task<List<ScheduleResponseDto>> GetSchedulesByDateAsync(DateTime date)
    {
        var schedules = await _unitOfWork.TeachingSchedules.GetAll()
            .AsNoTracking()
            .Include(ts => ts.Room)
            .Where(ts => ts.Date == date.Date)
            .OrderBy(ts => ts.Slot)
            .ToListAsync();

        return _mapper.Map<List<ScheduleResponseDto>>(schedules);
    }

    private int CalculateSlot(TimeSpan startTime)
    {
        // Slot 0: < 07:30
        // Slot 1 starts at 07:30
        // Slot 2 starts around 09:40-10:00, etc. (Approx 2h 10m intervals)
        
        var baseStart = new TimeSpan(7, 30, 0);
        if (startTime < baseStart) return 0;

        // Roughly calculate slot based on 2h 10m blocks (130 minutes)
        double minutesSinceBase = (startTime - baseStart).TotalMinutes;
        int slot = (int)Math.Floor(minutesSinceBase / 130.0) + 1;

        return Math.Min(slot, 12);
    }

}
