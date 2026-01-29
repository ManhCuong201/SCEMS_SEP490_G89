using SCEMS.Application.Services;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using SCEMS.Application.Common.Interfaces;

namespace SCEMS.Application;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register AutoMapper profiles manually
        services.AddAutoMapper(config =>
        {
            config.AddProfile(new SCEMS.Application.Mapping.MappingProfile());
        });
        
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IRoomService, RoomService>();
        services.AddScoped<IEquipmentTypeService, EquipmentTypeService>();
        services.AddScoped<IEquipmentService, EquipmentService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IImportService, ImportService>();
        services.AddScoped<ITeachingScheduleService, TeachingScheduleService>();
        services.AddScoped<IClassService, ClassService>();
        services.AddScoped<IRoomTypeService, RoomTypeService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();

        return services;
    }
}
