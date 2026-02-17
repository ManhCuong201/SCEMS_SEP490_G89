using AutoMapper;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.DTOs.Schedule;
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

    public async Task<string> ImportScheduleAsync(Stream excelStream, Guid lecturerId)
    {
        var lecturer = await _unitOfWork.Accounts.GetByIdAsync(lecturerId);
        if (lecturer == null) throw new Exception("Lecturer not found");

        using var workbook = new XLWorkbook(excelStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header

        var existingClassCodes = await _unitOfWork.Classes.GetAll()
            .Select(c => c.ClassCode)
            .ToListAsync();
        var processedClassCodes = new HashSet<string>(existingClassCodes);

        int importedCount = 0;
        int errorCount = 0;

        foreach (var row in rows)
        {
            try
            {
                var subjectCode = row.Cell(1).GetValue<string>();
                var startDateStr = row.Cell(2).GetValue<string>();
                var endDateStr = row.Cell(3).GetValue<string>();
                var daysOfWeekStr = row.Cell(4).GetValue<string>(); // "Mon,Wed" or "Monday"
                var startTimeStr = row.Cell(5).GetValue<string>(); // "07:30"
                var endTimeStr = row.Cell(6).GetValue<string>(); // "09:50"
                var roomName = row.Cell(7).GetValue<string>();
                var classCode = row.Cell(8).GetValue<string>();

                if (string.IsNullOrEmpty(classCode)) continue;

                // Auto-create class if not exists
                if (!processedClassCodes.Contains(classCode))
                {
                    await _unitOfWork.Classes.AddAsync(new Class
                    {
                        Id = Guid.NewGuid(),
                        ClassCode = classCode,
                        SubjectName = subjectCode,
                        LecturerId = lecturerId
                    });
                    processedClassCodes.Add(classCode);
                }

                DateTime startDate = DateTime.Parse(startDateStr);
                DateTime endDate = DateTime.Parse(endDateStr);
                
                var days = daysOfWeekStr.Split(',').Select(d => d.Trim()).ToList();
                var startTimes = startTimeStr.Split(',').Select(t => t.Trim()).ToList();
                var endTimes = endTimeStr.Split(',').Select(t => t.Trim()).ToList();
                var roomCodes = roomName.Split(',').Select(r => r.Trim()).ToList(); // 'roomName' variable now holds room codes

                // Build a map of Day -> (StartTime, EndTime, RoomCode)
                var dayConfigMap = new Dictionary<string, (TimeSpan start, TimeSpan end, string roomCode)>();
                for (int i = 0; i < days.Count; i++)
                {
                    string dayKey = days[i].ToLower();
                    TimeSpan sTime = TimeSpan.Parse(i < startTimes.Count ? startTimes[i] : startTimes[0]);
                    TimeSpan eTime = TimeSpan.Parse(i < endTimes.Count ? endTimes[i] : endTimes[0]);
                    string rCode = i < roomCodes.Count ? roomCodes[i] : roomCodes[0];
                    dayConfigMap[dayKey] = (sTime, eTime, rCode);
                }

                // Pre-fetch all rooms to avoid multiple DB calls in the date loop
                var distinctRoomCodes = dayConfigMap.Values.Select(v => v.roomCode).Distinct().ToList();
                var foundRooms = await _unitOfWork.Rooms.GetAll()
                    .Where(r => distinctRoomCodes.Contains(r.RoomCode)) 
                    .ToDictionaryAsync(r => r.RoomCode, r => r.Id); 
                
                // Expand date range
                for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
                {
                    var dotw = date.DayOfWeek.ToString().ToLower();
                    var dotwShort = dotw.Substring(0, 3);
                    
                    string? matchedDay = null;
                    if (dayConfigMap.ContainsKey(dotw)) matchedDay = dotw;
                    else if (dayConfigMap.ContainsKey(dotwShort)) matchedDay = dotwShort;

                    if (matchedDay != null)
                    {
                        var config = dayConfigMap[matchedDay];
                        int slot = CalculateSlot(config.start);

                        Guid roomId = foundRooms.ContainsKey(config.roomCode) ? foundRooms[config.roomCode] : Guid.Empty;

                        var schedule = new Teaching_Schedule
                        {
                            Subject = subjectCode,
                            ClassCode = classCode,
                            LecturerId = lecturerId.ToString(),
                            LecturerName = lecturer.FullName,
                            LecturerEmail = lecturer.Email,
                            Date = date,
                            Slot = slot,
                            StartTime = config.start,
                            EndTime = config.end,
                            RoomId = roomId
                        };

                        await _unitOfWork.TeachingSchedules.AddAsync(schedule);
                        importedCount++;
                    }
                }
            }
            catch
            {
                errorCount++;
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return $"Successfully imported {importedCount} sessions. Errors: {errorCount}";
    }

    public async Task<List<ScheduleResponseDto>> GetSchedulesByDateAsync(DateTime date)
    {
        var schedules = await _unitOfWork.TeachingSchedules.GetAll()
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
