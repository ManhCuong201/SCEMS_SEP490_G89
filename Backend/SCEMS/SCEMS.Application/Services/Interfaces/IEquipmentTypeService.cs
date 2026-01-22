using SCEMS.Application.Common;
using SCEMS.Application.DTOs.EquipmentType;

namespace SCEMS.Application.Services.Interfaces;

public interface IEquipmentTypeService
{
    Task<PaginatedEquipmentTypesDto> GetEquipmentTypesAsync(PaginationParams @params);
    Task<EquipmentTypeResponseDto?> GetEquipmentTypeByIdAsync(Guid id);
    Task<EquipmentTypeResponseDto> CreateEquipmentTypeAsync(CreateEquipmentTypeDto dto);
    Task<EquipmentTypeResponseDto?> UpdateEquipmentTypeAsync(Guid id, UpdateEquipmentTypeDto dto);
    Task<bool> DeleteEquipmentTypeAsync(Guid id);
    Task<bool> UpdateStatusAsync(Guid id, int status);
}
