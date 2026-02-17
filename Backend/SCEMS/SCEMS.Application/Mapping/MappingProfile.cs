using AutoMapper;
using SCEMS.Application.DTOs.Account;
using SCEMS.Application.DTOs.Room;
using SCEMS.Application.DTOs.EquipmentType;
using SCEMS.Application.DTOs.Equipment;
using SCEMS.Application.DTOs.Booking;
using SCEMS.Application.DTOs.Schedule;
using SCEMS.Application.DTOs.Class;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;

namespace SCEMS.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Account, AccountResponseDto>();
        CreateMap<Room, RoomResponseDto>()
            .ForMember(dest => dest.RoomTypeName, opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.Name : "N/A"));
        CreateMap<EquipmentType, EquipmentTypeResponseDto>();
        CreateMap<Equipment, EquipmentResponseDto>()
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.EquipmentTypeName, opt => opt.MapFrom(src => src.EquipmentType.Name))
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room.RoomName))
            .ForMember(dest => dest.RoomCode, opt => opt.MapFrom(src => src.Room.RoomCode));
        CreateMap<CreateEquipmentDto, Equipment>();
        CreateMap<UpdateEquipmentDto, Equipment>();
        CreateMap<Booking, BookingResponseDto>()
            .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.TimeSlot.AddHours(src.Duration)));
        CreateMap<CreateBookingDto, Booking>();
        CreateMap<Teaching_Schedule, ScheduleResponseDto>()
            .ForMember(dest => dest.LecturerEmail, opt => opt.MapFrom(src => src.LecturerEmail))
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room != null ? src.Room.RoomName : ""))
            .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.StartTime.ToString(@"hh\:mm")))
            .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.EndTime.ToString(@"hh\:mm")));

        CreateMap<Class, ClassResponseDto>();
        
        CreateMap<RoomType, SCEMS.Application.DTOs.RoomType.RoomTypeDto>()
            .ForMember(dest => dest.RoomCount, opt => opt.MapFrom(src => src.Rooms.Count));
        CreateMap<SCEMS.Application.DTOs.RoomType.CreateRoomTypeDto, RoomType>();
        CreateMap<SCEMS.Application.DTOs.RoomType.UpdateRoomTypeDto, RoomType>();
        
        CreateMap<RoomEquipmentHistory, EquipmentHistoryResponseDto>()
            .ForMember(dest => dest.RoomName, opt => opt.MapFrom(src => src.Room.RoomName))
            .ForMember(dest => dest.RoomCode, opt => opt.MapFrom(src => src.Room.RoomCode));
    }
}
