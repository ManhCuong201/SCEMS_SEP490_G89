using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Equipment;

namespace SCEMS.Application.Services.Interfaces;

public interface IEquipmentService
{
    Task<PaginatedEquipmentDto> GetEquipmentAsync(PaginationParams @params);
    Task<EquipmentResponseDto?> GetEquipmentByIdAsync(Guid id);
    Task<EquipmentResponseDto> CreateEquipmentAsync(CreateEquipmentDto dto);
    Task<EquipmentResponseDto?> UpdateEquipmentAsync(Guid id, UpdateEquipmentDto dto);
    Task<bool> DeleteEquipmentAsync(Guid id);
    Task<bool> UpdateStatusAsync(Guid id, int status);
    Task<int> ImportEquipmentAsync(Stream fileStream);
    Task<Stream> GetTemplateStreamAsync();
}
