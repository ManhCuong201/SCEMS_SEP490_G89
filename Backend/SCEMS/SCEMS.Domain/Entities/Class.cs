using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCEMS.Domain.Entities;

public class Class : BaseEntity
{
    [Required]
    public string ClassCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    
    public Guid LecturerId { get; set; }
    public Account? Lecturer { get; set; }

    public ICollection<ClassStudent> EnrolledStudents { get; set; } = new List<ClassStudent>();
}
