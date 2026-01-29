using SCEMS.Application.DTOs.Account;

namespace SCEMS.Application.DTOs.Class;

public class ClassResponseDto
{
    public Guid Id { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public Guid LecturerId { get; set; }
}

public class EnrolledStudentDto
{
    public string Id { get; set; } = string.Empty; // Account Id if registered, otherwise dummy string for DataTable
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? StudentCode { get; set; }
    public string Status { get; set; } = string.Empty; // Active, Inactive, Pending
}
