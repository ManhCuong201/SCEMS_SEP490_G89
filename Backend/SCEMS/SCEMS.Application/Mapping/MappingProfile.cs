using AutoMapper;
using SCEMS.Application.DTOs.Account;
using SCEMS.Application.DTOs.Room;
using SCEMS.Application.DTOs.EquipmentType;
using SCEMS.Application.DTOs.Equipment;
using SCEMS.Domain.Entities;

namespace SCEMS.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Account, AccountResponseDto>();
        CreateMap<Room, RoomResponseDto>();
        CreateMap<EquipmentType, EquipmentTypeResponseDto>();
        CreateMap<Equipment, EquipmentResponseDto>()
            .ForMember(dest => dest.EquipmentTypeName, opt => opt.MapFrom(src => src.EquipmentType.Name))
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room.RoomName));
        CreateMap<CreateEquipmentDto, Equipment>();
        CreateMap<UpdateEquipmentDto, Equipment>();
    }
}
