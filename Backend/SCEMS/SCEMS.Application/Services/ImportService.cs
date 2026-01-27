using ClosedXML.Excel;
using SCEMS.Application.Common.Interfaces;
using SCEMS.Application.DTOs.Import;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class ImportService : IImportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public ImportService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<ImportResultDto> ImportAccountsAsync(Stream fileStream)
    {
        var result = new ImportResultDto();
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1); // Skip header

        foreach (var row in rows)
        {
            try
            {
                var fullName = row.Cell(1).GetValue<string>();
                var email = row.Cell(2).GetValue<string>();
                var studentCode = row.Cell(3).GetValue<string>(); // FE ID
                var password = row.Cell(4).GetValue<string>();
                var roleStr = row.Cell(5).GetValue<string>();

                if (string.IsNullOrWhiteSpace(email)) continue;

                var existingAccount = await _unitOfWork.Accounts.GetByEmailAsync(email);
                if (existingAccount != null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Email {email} already exists.");
                    continue;
                }
                
                // Determine Role
                if (!Enum.TryParse<AccountRole>(roleStr, true, out var role))
                {
                     // Default to Student if not specified or invalid
                     role = AccountRole.Student;
                }

                var account = new Account
                {
                    FullName = fullName,
                    Email = email,
                    StudentCode = studentCode,
                    Role = role,
                    PasswordHash = _passwordHasher.HashPassword(password),
                    Status = AccountStatus.Active
                };

                await _unitOfWork.Accounts.AddAsync(account);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Row {row.RowNumber()}: {ex.Message}");
            }
        }
        
        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    public async Task<ImportResultDto> ImportTeachingScheduleAsync(Stream fileStream)
    {
        var result = new ImportResultDto();
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1);

        var rooms = await _unitOfWork.Rooms.GetAllAsync(); 

        foreach (var row in rows)
        {
            try
            {
                var subject = row.Cell(1).GetValue<string>();
                var classCode = row.Cell(2).GetValue<string>();
                var roomName = row.Cell(3).GetValue<string>();
                var date = row.Cell(4).GetValue<DateTime>();
                var lecturer = row.Cell(7).GetValue<string>();

                // Attempt to read Time directly first, if not, read as Slot int
                TimeSpan startTime;
                TimeSpan endTime;

                // Check col 5/6 for Time or Int
                var startCell = row.Cell(5);
                var endCell = row.Cell(6);

                if (startCell.DataType == XLDataType.TimeSpan || startCell.Value.ToString().Contains(":"))
                {
                    startTime = startCell.GetValue<TimeSpan>();
                    endTime = endCell.GetValue<TimeSpan>();
                }
                else
                {
                    // Fallback to Slot Logic
                    var startSlot = startCell.GetValue<int>();
                    var endSlot = endCell.GetValue<int>();
                    
                    startTime = GetStartTimeForSlot(startSlot);
                    endTime = GetEndTimeForSlot(endSlot);
                }

                var room = rooms.FirstOrDefault(r => r.RoomName.Equals(roomName, StringComparison.OrdinalIgnoreCase));
                if (room == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Room {roomName} not found.");
                    continue;
                }

                var schedule = new Teaching_Schedule
                {
                    Subject = subject,
                    ClassCode = classCode,
                    RoomId = room.Id,
                    Date = date,
                    StartTime = startTime,
                    EndTime = endTime,
                    LecturerName = lecturer
                };

                await _unitOfWork.TeachingSchedules.AddAsync(schedule);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors.Add($"Row {row.RowNumber()}: {ex.Message}");
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return result;
    }

    private TimeSpan GetStartTimeForSlot(int slot)
    {
        return slot switch
        {
            1 => new TimeSpan(7, 30, 0),
            2 => new TimeSpan(10, 0, 0),
            3 => new TimeSpan(12, 50, 0),
            4 => new TimeSpan(15, 20, 0),
            _ => TimeSpan.Zero // Or throw
        };
    }

    private TimeSpan GetEndTimeForSlot(int slot)
    {
        // User provided specific end times.
        // 1: 07:30 - 09:50
        // 2: 10:00 - 12:20
        // 3: 12:50 - 15:10
        // 4: 15:20 - 17:40
        return slot switch
        {
            1 => new TimeSpan(9, 50, 0),
            2 => new TimeSpan(12, 20, 0),
            _ => slot switch {
                3 => new TimeSpan(15, 10, 0),
                4 => new TimeSpan(17, 40, 0),
                 _ => TimeSpan.Zero
            }
        };
    }
}
