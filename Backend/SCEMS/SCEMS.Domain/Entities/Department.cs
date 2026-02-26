using System.ComponentModel.DataAnnotations;

namespace SCEMS.Domain.Entities;

public class Department : BaseEntity
{
    [Required]
    [MaxLength(20)]
    public string DepartmentCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DepartmentName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
