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
                var dateStr = row.Cell(4).GetValue<string>(); // Read as string for multi-date support
                var lecturer = row.Cell(9).GetValue<string>();

                var room = rooms.FirstOrDefault(r => r.RoomName.Equals(roomName, StringComparison.OrdinalIgnoreCase));
                if (room == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Room {roomName} not found.");
                    continue;
                }

                // Parse Multiple Dates (CSV)
                var dateStrings = dateStr.Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                                        .Select(d => d.Trim())
                                        .ToList();

                foreach (var singleDateStr in dateStrings)
                {
                    if (!DateTime.TryParse(singleDateStr, out var date)) continue;

                    // Handle Specific Time vs Slot Logic
                    var startTimeCell = row.Cell(5);
                    var endTimeCell = row.Cell(6);
                    var isNewSlotCell = row.Cell(7);
                    var slotCell = row.Cell(8);

                    if (!startTimeCell.IsEmpty() && !endTimeCell.IsEmpty())
                    {
                        var startTimes = startTimeCell.GetValue<string>().Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).ToList();
                        var endTimes = endTimeCell.GetValue<string>().Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).ToList();

                        for (int i = 0; i < Math.Min(startTimes.Count, endTimes.Count); i++)
                        {
                            if (TimeSpan.TryParse(startTimes[i].Trim(), out var startTime) && 
                                TimeSpan.TryParse(endTimes[i].Trim(), out var endTime))
                            {
                                await AddScheduleAsync(subject, classCode, room.Id, date, startTime, endTime, lecturer);
                                result.SuccessCount++;
                            }
                        }
                    }
                    else if (!slotCell.IsEmpty())
                    {
                        var slotEntry = slotCell.GetValue<string>();
                        var isNewSlotStr = isNewSlotCell.GetValue<string>();
                        bool isNewSlot = isNewSlotStr.Equals("Yes", StringComparison.OrdinalIgnoreCase) || 
                                         isNewSlotStr.Equals("True", StringComparison.OrdinalIgnoreCase) ||
                                         isNewSlotStr.Equals("1");

                        var slotNumbers = ParseSlots(slotEntry);

                        foreach (var slot in slotNumbers)
                        {
                            var startTime = GetStartTimeForSlot(slot, isNewSlot);
                            var endTime = GetEndTimeForSlot(slot, isNewSlot);

                            if (startTime != TimeSpan.Zero && endTime != TimeSpan.Zero)
                            {
                                await AddScheduleAsync(subject, classCode, room.Id, date, startTime, endTime, lecturer);
                                result.SuccessCount++;
                            }
                        }
                    }
                }
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

    private async Task AddScheduleAsync(string subject, string classCode, Guid roomId, DateTime date, TimeSpan start, TimeSpan end, string lecturer)
    {
        var schedule = new Teaching_Schedule
        {
            Subject = subject,
            ClassCode = classCode,
            RoomId = roomId,
            Date = date,
            StartTime = start,
            EndTime = end,
            LecturerName = lecturer
        };
        await _unitOfWork.TeachingSchedules.AddAsync(schedule);
    }

    private List<int> ParseSlots(string slotEntry)
    {
        var slots = new List<int>();
        if (string.IsNullOrWhiteSpace(slotEntry)) return slots;

        // Handle Range "1-4"
        if (slotEntry.Contains("-"))
        {
            var parts = slotEntry.Split('-');
            if (parts.Length == 2 && int.TryParse(parts[0], out int start) && int.TryParse(parts[1], out int end))
            {
                for (int i = Math.Min(start, end); i <= Math.Max(start, end); i++)
                {
                    slots.Add(i);
                }
                return slots;
            }
        }

        // Handle CSV "1, 2, 3"
        var items = slotEntry.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var item in items)
        {
            if (int.TryParse(item, out int s)) slots.Add(s);
        }

        return slots.Distinct().OrderBy(s => s).ToList();
    }

    private TimeSpan GetStartTimeForSlot(int slot, bool isNewSlot)
    {
        if (isNewSlot)
        {
            return slot switch
            {
                1 => new TimeSpan(7, 30, 0),
                2 => new TimeSpan(10, 0, 0),
                3 => new TimeSpan(12, 50, 0),
                4 => new TimeSpan(15, 20, 0),
                5 => new TimeSpan(18, 0, 0),
                6 => new TimeSpan(20, 0, 0),
                _ => TimeSpan.Zero
            };
        }
        else // Old Slot
        {
            return slot switch
            {
                1 => new TimeSpan(7, 30, 0),
                2 => new TimeSpan(9, 10, 0),
                3 => new TimeSpan(10, 50, 0),
                4 => new TimeSpan(12, 50, 0),
                5 => new TimeSpan(14, 30, 0),
                6 => new TimeSpan(16, 10, 0),
                7 => new TimeSpan(18, 0, 0),
                8 => new TimeSpan(19, 45, 0),
                _ => TimeSpan.Zero
            };
        }
    }

    private TimeSpan GetEndTimeForSlot(int slot, bool isNewSlot)
    {
        if (isNewSlot)
        {
            return slot switch
            {
                1 => new TimeSpan(9, 50, 0),
                2 => new TimeSpan(12, 20, 0),
                3 => new TimeSpan(15, 10, 0),
                4 => new TimeSpan(17, 40, 0),
                5 => new TimeSpan(20, 20, 0),
                6 => new TimeSpan(22, 20, 0),
                _ => TimeSpan.Zero
            };
        }
        else // Old Slot
        {
            return slot switch
            {
                1 => new TimeSpan(9, 0, 0),
                2 => new TimeSpan(10, 40, 0),
                3 => new TimeSpan(12, 20, 0),
                4 => new TimeSpan(14, 20, 0),
                5 => new TimeSpan(16, 0, 0),
                6 => new TimeSpan(17, 40, 0),
                7 => new TimeSpan(19, 30, 0),
                8 => new TimeSpan(21, 15, 0),
                _ => TimeSpan.Zero
            };
        }
    }

    public async Task<Stream> GetAccountTemplateStreamAsync()
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Account Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Full Name";
        worksheet.Cell(1, 2).Value = "Email";
        worksheet.Cell(1, 3).Value = "Student Code";
        worksheet.Cell(1, 4).Value = "Password";
        worksheet.Cell(1, 5).Value = "Role";

        // Style
        var header = worksheet.Range("A1:E1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample data
        worksheet.Cell(2, 1).Value = "John Doe";
        worksheet.Cell(2, 2).Value = "john@example.com";
        worksheet.Cell(2, 3).Value = "HE123456";
        worksheet.Cell(2, 4).Value = "User123!";
        worksheet.Cell(2, 5).Value = "Student";

        worksheet.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }

    public async Task<Stream> GetTeachingScheduleTemplateStreamAsync()
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Teaching Schedule Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Subject";
        worksheet.Cell(1, 2).Value = "Class Code";
        worksheet.Cell(1, 3).Value = "Room Name";
        worksheet.Cell(1, 4).Value = "Date (CSV support)";
        worksheet.Cell(1, 5).Value = "Start Time (CSV)";
        worksheet.Cell(1, 6).Value = "End Time (CSV)";
        worksheet.Cell(1, 7).Value = "Is New Slot (Yes/No)";
        worksheet.Cell(1, 8).Value = "Slot Number (CSV/Range)";
        worksheet.Cell(1, 9).Value = "Lecturer";

        // Style
        var header = worksheet.Range("A1:I1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample data 1: Specific times + multiple dates
        worksheet.Cell(2, 1).Value = "PRN231";
        worksheet.Cell(2, 2).Value = "SE1701";
        worksheet.Cell(2, 3).Value = "A101";
        worksheet.Cell(2, 4).Value = "2026-02-01, 2026-02-03";
        worksheet.Cell(2, 5).Value = "07:30, 10:00";
        worksheet.Cell(2, 6).Value = "09:50, 12:20";
        worksheet.Cell(2, 9).Value = "Lecturer A";

        // Sample data 2: Slot logic + range
        worksheet.Cell(3, 1).Value = "SWP391";
        worksheet.Cell(3, 2).Value = "SE1702";
        worksheet.Cell(3, 3).Value = "B202";
        worksheet.Cell(3, 4).Value = "2026-02-02";
        worksheet.Cell(3, 7).Value = "Yes";
        worksheet.Cell(3, 8).Value = "1-3";
        worksheet.Cell(3, 9).Value = "Lecturer B";

        worksheet.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }
}
