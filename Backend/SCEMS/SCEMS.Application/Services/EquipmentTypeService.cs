using AutoMapper;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.EquipmentType;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class EquipmentTypeService : IEquipmentTypeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public EquipmentTypeService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedEquipmentTypesDto> GetEquipmentTypesAsync(PaginationParams @params)
    {
        var query = _unitOfWork.EquipmentTypes.GetAll();

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(et => et.Name.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(@params.SortBy))
        {
            query = @params.SortBy.ToLowerInvariant() switch
            {
                "name" => query.OrderBy(et => et.Name),
                "recent" => query.OrderByDescending(et => et.CreatedAt),
                _ => query.OrderBy(et => et.Name)
            };
        }
        else
        {
            query = query.OrderByDescending(et => et.CreatedAt);
        }

        var total = query.Count();
        var items = query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .ToList();

        var dtos = items.Select(et => new EquipmentTypeResponseDto
        {
            Id = et.Id,
            Name = et.Name,
            Description = et.Description,
            Status = et.Status,
            EquipmentCount = et.Equipment.Count,
            CreatedAt = et.CreatedAt,
            UpdatedAt = et.UpdatedAt
        }).ToList();

        return new PaginatedEquipmentTypesDto
        {
            Items = dtos,
            Total = total,
            PageIndex = @params.PageIndex,
            PageSize = @params.PageSize
        };
    }

    public async Task<EquipmentTypeResponseDto?> GetEquipmentTypeByIdAsync(Guid id)
    {
        var equipmentType = await _unitOfWork.EquipmentTypes.GetByIdAsync(id);
        if (equipmentType == null)
        {
            return null;
        }

        return new EquipmentTypeResponseDto
        {
            Id = equipmentType.Id,
            Name = equipmentType.Name,
            Description = equipmentType.Description,
            Status = equipmentType.Status,
            EquipmentCount = equipmentType.Equipment.Count,
            CreatedAt = equipmentType.CreatedAt,
            UpdatedAt = equipmentType.UpdatedAt
        };
    }

    public async Task<EquipmentTypeResponseDto> CreateEquipmentTypeAsync(CreateEquipmentTypeDto dto)
    {
        var existingType = await _unitOfWork.EquipmentTypes.GetByNameAsync(dto.Name);
        if (existingType != null)
        {
            throw new InvalidOperationException($"Equipment type with name {dto.Name} already exists");
        }

        var equipmentType = new EquipmentType
        {
            Name = dto.Name,
            Description = dto.Description
        };

        await _unitOfWork.EquipmentTypes.AddAsync(equipmentType);
        await _unitOfWork.SaveChangesAsync();

        return new EquipmentTypeResponseDto
        {
            Id = equipmentType.Id,
            Name = equipmentType.Name,
            Description = equipmentType.Description,
            Status = equipmentType.Status,
            EquipmentCount = 0,
            CreatedAt = equipmentType.CreatedAt,
            UpdatedAt = equipmentType.UpdatedAt
        };
    }

    public async Task<EquipmentTypeResponseDto?> UpdateEquipmentTypeAsync(Guid id, UpdateEquipmentTypeDto dto)
    {
        var equipmentType = await _unitOfWork.EquipmentTypes.GetByIdAsync(id);
        if (equipmentType == null)
        {
            return null;
        }

        var existingType = await _unitOfWork.EquipmentTypes.GetByNameAsync(dto.Name);
        if (existingType != null && existingType.Id != id)
        {
            throw new InvalidOperationException($"Equipment type with name {dto.Name} already exists");
        }

        equipmentType.Name = dto.Name;
        equipmentType.Description = dto.Description;

        _unitOfWork.EquipmentTypes.Update(equipmentType);
        await _unitOfWork.SaveChangesAsync();

        return new EquipmentTypeResponseDto
        {
            Id = equipmentType.Id,
            Name = equipmentType.Name,
            Description = equipmentType.Description,
            Status = equipmentType.Status,
            EquipmentCount = equipmentType.Equipment.Count,
            CreatedAt = equipmentType.CreatedAt,
            UpdatedAt = equipmentType.UpdatedAt
        };
    }

    public async Task<bool> DeleteEquipmentTypeAsync(Guid id)
    {
        var equipmentType = await _unitOfWork.EquipmentTypes.GetByIdAsync(id);
        if (equipmentType == null)
        {
            return false;
        }

        _unitOfWork.EquipmentTypes.Delete(equipmentType);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, int status)
    {
        var equipmentType = await _unitOfWork.EquipmentTypes.GetByIdAsync(id);
        if (equipmentType == null)
        {
            return false;
        }

        equipmentType.Status = (SCEMS.Domain.Enums.EquipmentTypeStatus)status;
        _unitOfWork.EquipmentTypes.Update(equipmentType);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
}
