using AutoMapper;
using SCEMS.Application.DTOs.Account;
using SCEMS.Application.DTOs.Room;
using SCEMS.Application.DTOs.EquipmentType;
using SCEMS.Domain.Entities;

namespace SCEMS.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Account, AccountResponseDto>();
        CreateMap<Room, RoomResponseDto>();
        CreateMap<EquipmentType, EquipmentTypeResponseDto>();
    }
}
