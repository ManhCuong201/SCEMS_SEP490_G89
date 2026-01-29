using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SCEMS.Application.DTOs.RoomType;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class RoomTypeService : IRoomTypeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public RoomTypeService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<RoomTypeDto>> GetAllAsync()
    {
        var types = await _unitOfWork.RoomTypes.GetAll()
            .Include(r => r.Rooms)
            .ToListAsync();
        return _mapper.Map<IEnumerable<RoomTypeDto>>(types);
    }

    public async Task<RoomTypeDto?> GetByIdAsync(Guid id)
    {
        var type = await _unitOfWork.RoomTypes.GetAll()
            .Include(r => r.Rooms)
            .FirstOrDefaultAsync(r => r.Id == id);
        return _mapper.Map<RoomTypeDto>(type);
    }

    public async Task<RoomTypeDto> CreateAsync(CreateRoomTypeDto dto)
    {
        var type = _mapper.Map<RoomType>(dto);
        await _unitOfWork.RoomTypes.AddAsync(type);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<RoomTypeDto>(type);
    }

    public async Task<RoomTypeDto> UpdateAsync(Guid id, UpdateRoomTypeDto dto)
    {
        var type = await _unitOfWork.RoomTypes.GetByIdAsync(id);
        if (type == null) throw new KeyNotFoundException("Room Type not found");

        _mapper.Map(dto, type);
        _unitOfWork.RoomTypes.Update(type);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<RoomTypeDto>(type);
    }

    public async Task DeleteAsync(Guid id)
    {
        var type = await _unitOfWork.RoomTypes.GetByIdAsync(id);
        if (type == null) throw new KeyNotFoundException("Room Type not found");
        
        // Cascade delete is handled by EF Core configuration in ScemsDbContext
        _unitOfWork.RoomTypes.Delete(type);
        await _unitOfWork.SaveChangesAsync();
    }
}
