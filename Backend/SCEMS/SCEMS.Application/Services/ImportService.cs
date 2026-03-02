using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.Common.Interfaces;
using SCEMS.Application.DTOs.Import;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Application.Common;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class ImportService : IImportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly INotificationService _notificationService;

    public ImportService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _notificationService = notificationService;
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

        var existingClassCodes = await _unitOfWork.Classes.GetAll()
            .Select(c => c.ClassCode)
            .ToListAsync();
        var processedClassCodes = new HashSet<string>(existingClassCodes);

        foreach (var row in rows)
        {
            try
            {
                var subject = row.Cell(1).GetValue<string>()?.Trim();
                var classCode = row.Cell(2).GetValue<string>()?.Trim();
                var roomName = row.Cell(3).GetValue<string>()?.Trim();
                var daysOfWeekStr = row.Cell(6).GetValue<string>()?.Trim();
                var slotType = row.Cell(7).GetValue<string>()?.Trim();
                var slotEntry = row.Cell(8).GetValue<string>()?.Trim();
                var lecturerCode = row.Cell(9).GetValue<string>()?.Trim();

                if (string.IsNullOrWhiteSpace(classCode)) continue;

                var room = rooms.FirstOrDefault(r => r.RoomName.Equals(roomName, StringComparison.OrdinalIgnoreCase) || r.RoomCode.Equals(roomName, StringComparison.OrdinalIgnoreCase));
                if (room == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Room {roomName} not found.");
                    continue;
                }

                var searchCode = lecturerCode.Trim().ToLower();
                var lecturerAccount = await _unitOfWork.Accounts.GetAll().FirstOrDefaultAsync(a => 
                    (a.StudentCode != null && a.StudentCode.ToLower() == searchCode) || 
                    (a.Email != null && a.Email.ToLower() == searchCode) || 
                    (a.Email != null && a.Email.ToLower().StartsWith(searchCode + "@")) ||
                    (a.FullName != null && a.FullName.ToLower() == searchCode)
                );
                if (lecturerAccount == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Lecturer with code {lecturerCode} not found.");
                    continue;
                }

                if (!processedClassCodes.Contains(classCode))
                {
                    await _unitOfWork.Classes.AddAsync(new Class
                    {
                        Id = Guid.NewGuid(),
                        ClassCode = classCode,
                        SubjectName = subject,
                        LecturerId = lecturerAccount.Id
                    });
                    processedClassCodes.Add(classCode);
                }

                var fromCell = row.Cell(4);
                if (!TryParseExcelDate(fromCell, out var fromDate))
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Invalid From Date: {fromCell.GetString()}");
                    continue;
                }

                var toCell = row.Cell(5);
                if (!TryParseExcelDate(toCell, out var toDate))
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Invalid To Date: {toCell.GetString()}");
                    continue;
                }

                var targetDays = ParseDaysOfWeek(daysOfWeekStr);
                if (!targetDays.Any())
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Invalid or missing days of week: {daysOfWeekStr}");
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(slotEntry))
                {
                    var slotGroups = ParseSlots(slotEntry);
                    // Determine if we should map group-to-day (1-to-1)
                    bool use1to1Mapping = targetDays.Count > 1 && targetDays.Count == slotGroups.Count;

                    for (var current = fromDate.Date; current <= toDate.Date; current = current.AddDays(1))
                    {
                        int dayIndex = targetDays.IndexOf(current.DayOfWeek);
                        if (dayIndex >= 0)
                        {
                            IEnumerable<int> slotsToApply;
                            if (use1to1Mapping)
                            {
                                slotsToApply = slotGroups[dayIndex];
                            }
                            else
                            {
                                // Flatten all groups to apply to all target days
                                slotsToApply = slotGroups.SelectMany(g => g).Distinct().OrderBy(s => s);
                            }

                            foreach (var slot in slotsToApply)
                            {
                                var times = SlotHelper.GetSlotTimes(slotType, slot);

                                var schedule = new Teaching_Schedule
                                {
                                    Subject = subject,
                                    ClassCode = classCode,
                                    RoomId = room.Id,
                                    Date = current,
                                    Slot = slot,
                                    StartTime = times.StartTime,
                                    EndTime = times.EndTime,
                                    LecturerId = lecturerAccount.Id.ToString(),
                                    LecturerName = lecturerAccount.FullName,
                                    LecturerEmail = lecturerAccount.Email
                                };
                                await _unitOfWork.TeachingSchedules.AddAsync(schedule);

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
        
        if (result.SuccessCount > 0)
        {
            var msg = $"Đã nhập thành công {result.SuccessCount} lịch giảng dạy mới.";
            await _notificationService.SendToRoleAsync(AccountRole.Admin, "Nhật ký hệ thống: Nhập lịch giảng dạy", msg);
            await _notificationService.SendToRoleAsync(AccountRole.BookingStaff, "Kết quả nhập lịch giảng dạy", msg);
            await _notificationService.SendToRoleAsync(AccountRole.Lecturer, "Cập nhật lịch giảng dạy", "Có lịch giảng dạy mới được cập nhật. Vui lòng kiểm tra lịch của bạn.");
            await _notificationService.SendToRoleAsync(AccountRole.Guard, "Cập nhật phòng học", "Có lịch sử dụng phòng mới được hệ thống cập nhật.");
            await _notificationService.SendToRoleAsync(AccountRole.AssetStaff, "Yêu cầu chuẩn bị thiết bị", "Lịch học mới đã được cập nhật. Vui lòng chuẩn bị trang thiết bị cho các phòng.");
            await _notificationService.SendToRoleAsync(AccountRole.Student, "Cập nhật lịch học", "Lịch học mới đã được cập nhật. Vui lòng xem thời khóa biểu của bạn.");
        }

        return result;
    }

    // (Removed AddScheduleAsync as we do it inline to pass slot and full lecturer info)

    private bool TryParseExcelDate(IXLCell cell, out DateTime result)
    {
        if (cell.TryGetValue<DateTime>(out result))
            return true;

        var strValue = cell.GetValue<string>()?.Trim();
        if (string.IsNullOrWhiteSpace(strValue))
            return false;

        string[] formats = { 
            "yyyy-MM-dd", "yyyy/MM/dd", "yyyy.MM.dd",
            "dd-MM-yyyy", "dd/MM/yyyy", "dd.MM.yyyy",
            "MM-dd-yyyy", "MM/dd/yyyy", "MM.dd.yyyy",
            "yyyy-d-M", "yyyy/d/M",
            "d-M-yyyy", "d/M/yyyy",
            "yyyy-dd-MM", "yyyy/dd/MM" // The specific case the user encountered ("2026-23-02")
        };

        return DateTime.TryParseExact(strValue, formats, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out result) || DateTime.TryParse(strValue, out result);
    }

    private List<List<int>> ParseSlots(string slotEntry)
    {
        var groups = new List<List<int>>();
        if (string.IsNullOrWhiteSpace(slotEntry)) return groups;

        var items = slotEntry.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var item in items)
        {
            var cleanItem = item.Trim();
            var groupSlots = new List<int>();

            if (cleanItem.Contains("-"))
            {
                var parts = cleanItem.Split('-');
                if (parts.Length == 2 && int.TryParse(parts[0], out int start) && int.TryParse(parts[1], out int end))
                {
                    for (int i = Math.Min(start, end); i <= Math.Max(start, end); i++)
                    {
                        groupSlots.Add(i);
                    }
                }
            }
            else if (int.TryParse(cleanItem, out int s))
            {
                groupSlots.Add(s);
            }

            if (groupSlots.Any())
            {
                groups.Add(groupSlots.Distinct().OrderBy(s => s).ToList());
            }
        }

        return groups;
    }

    private List<DayOfWeek> ParseDaysOfWeek(string input)
    {
        var result = new List<DayOfWeek>();
        if(string.IsNullOrWhiteSpace(input)) return result;

        var parts = input.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            var cleanPart = part.Trim().ToLower();
            
            // Vietnamese/Asian standard commonly used: 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat, 8=Sun
            if (int.TryParse(cleanPart, out int number))
            {
                if (number >= 2 && number <= 7) result.Add((DayOfWeek)(number - 1));
                else if (number == 8) result.Add(DayOfWeek.Sunday);
            }
            else
            {
                if (cleanPart.StartsWith("mon")) result.Add(DayOfWeek.Monday);
                else if (cleanPart.StartsWith("tue")) result.Add(DayOfWeek.Tuesday);
                else if (cleanPart.StartsWith("wed")) result.Add(DayOfWeek.Wednesday);
                else if (cleanPart.StartsWith("thu")) result.Add(DayOfWeek.Thursday);
                else if (cleanPart.StartsWith("fri")) result.Add(DayOfWeek.Friday);
                else if (cleanPart.StartsWith("sat")) result.Add(DayOfWeek.Saturday);
                else if (cleanPart.StartsWith("sun")) result.Add(DayOfWeek.Sunday);
            }
        }
        return result.Distinct().ToList();
    }

    public async Task<Stream> GetAccountTemplateStreamAsync()
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Account Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Họ và tên";
        worksheet.Cell(1, 2).Value = "Email";
        worksheet.Cell(1, 3).Value = "Mã sinh viên/Giảng viên";
        worksheet.Cell(1, 4).Value = "Mật khẩu";
        worksheet.Cell(1, 5).Value = "Vai trò (Admin/Lecturer/Student/Staff)";

        // Style
        var header = worksheet.Range("A1:E1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample data
        worksheet.Cell(2, 1).Value = "Nguyễn Văn A";
        worksheet.Cell(2, 2).Value = "nguyenvana@example.com";
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
        worksheet.Cell(1, 1).Value = "Môn học";
        worksheet.Cell(1, 2).Value = "Mã lớp";
        worksheet.Cell(1, 3).Value = "Tên phòng";
        worksheet.Cell(1, 4).Value = "Từ ngày";
        worksheet.Cell(1, 5).Value = "Đến ngày";
        worksheet.Cell(1, 6).Value = "Các ngày trong tuần (VD: Mon,Wed HOẶC 2,4)";
        worksheet.Cell(1, 7).Value = "Loại slot (Old/New)";
        worksheet.Cell(1, 8).Value = "Số slot (Phẩy/Khoảng)";
        worksheet.Cell(1, 9).Value = "Mã GV hoặc Email GV";

        // Style
        var header = worksheet.Range("A1:I1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample data 1: Slot logic + range + days of week
        worksheet.Cell(2, 1).Value = "PRN231";
        worksheet.Cell(2, 2).Value = "SE1701";
        worksheet.Cell(2, 3).Value = "A101";
        worksheet.Cell(2, 4).Value = "2026-02-02";
        worksheet.Cell(2, 5).Value = "2026-04-10";
        worksheet.Cell(2, 6).Value = "Mon, Wed, Fri";
        worksheet.Cell(2, 7).Value = "New";
        worksheet.Cell(2, 8).Value = "1-3";
        worksheet.Cell(2, 9).Value = "LecturerA";

        // Sample data 2: Old slot logic, using numbers for days (2=Mon, 4=Wed)
        worksheet.Cell(3, 1).Value = "SWP391";
        worksheet.Cell(3, 2).Value = "SE1702";
        worksheet.Cell(3, 3).Value = "B202";
        worksheet.Cell(3, 4).Value = "2026-02-02";
        worksheet.Cell(3, 5).Value = "2026-04-10";
        worksheet.Cell(3, 6).Value = "2, 4";
        worksheet.Cell(3, 7).Value = "Old";
        worksheet.Cell(3, 8).Value = "4, 5";
        worksheet.Cell(3, 9).Value = "john_doe";

        worksheet.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }

    public async Task<ImportResultDto> ImportStudentsToClassesAsync(Stream fileStream)
    {
        var result = new ImportResultDto();
        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheet(1);
        var rows = worksheet.RowsUsed().Skip(1);

        var existingClasses = await _unitOfWork.Classes.GetAll().ToListAsync();
        var existingStudents = await _unitOfWork.Accounts.GetAll().Where(a => a.Role == AccountRole.Student).ToListAsync();
        var existingClassStudents = await _unitOfWork.ClassStudents.GetAll().ToListAsync();

        foreach (var row in rows)
        {
            try
            {
                var classCode = row.Cell(1).GetValue<string>()?.Trim();
                var studentSearch = row.Cell(2).GetValue<string>()?.Trim(); // Code or Email

                if (string.IsNullOrWhiteSpace(classCode) || string.IsNullOrWhiteSpace(studentSearch)) continue;

                var targetClass = existingClasses.FirstOrDefault(c => c.ClassCode.Equals(classCode, StringComparison.OrdinalIgnoreCase));
                if (targetClass == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Class {classCode} not found.");
                    continue;
                }

                var searchStr = studentSearch.ToLower();
                var targetStudent = existingStudents.FirstOrDefault(s => 
                    (s.StudentCode != null && s.StudentCode.ToLower() == searchStr) || 
                    (s.Email != null && s.Email.ToLower() == searchStr) ||
                    (s.Email != null && s.Email.ToLower().StartsWith(searchStr + "@"))
                );

                if (targetStudent == null)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Student {studentSearch} not found.");
                    continue;
                }

                var exists = existingClassStudents.Any(cs => cs.ClassId == targetClass.Id && cs.StudentId == targetStudent.Id);
                if (exists)
                {
                    result.FailureCount++;
                    result.Errors.Add($"Row {row.RowNumber()}: Student {studentSearch} is already in class {classCode}.");
                    continue;
                }

                var newClassStudent = new ClassStudent
                {
                    ClassId = targetClass.Id,
                    StudentId = targetStudent.Id
                };

                await _unitOfWork.ClassStudents.AddAsync(newClassStudent);
                
                // Add to tracked list to prevent duplicates in the same file
                existingClassStudents.Add(newClassStudent);

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

    public async Task<Stream> GetStudentClassTemplateStreamAsync()
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Student Class Template");

        // Headers
        worksheet.Cell(1, 1).Value = "Mã lớp";
        worksheet.Cell(1, 2).Value = "Mã sinh viên (hoặc Email/Tiền tố)";

        // Style
        var header = worksheet.Range("A1:B1");
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightGray;

        // Sample data
        worksheet.Cell(2, 1).Value = "SE1701";
        worksheet.Cell(2, 2).Value = "HE130456";
        
        worksheet.Cell(3, 1).Value = "SE1701";
        worksheet.Cell(3, 2).Value = "john.doe@example.com";

        worksheet.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }
}
