using System.ComponentModel.DataAnnotations;

namespace SCEMS.Domain.Entities;

public class ClassStudent : BaseEntity
{
    [Required]
    public Guid ClassId { get; set; }
    public Class? Class { get; set; }

    public Guid? StudentId { get; set; }
    public Account? Student { get; set; }

    public string? PendingStudentIdentifier { get; set; } // Email or StudentCode for unregistered students
}
