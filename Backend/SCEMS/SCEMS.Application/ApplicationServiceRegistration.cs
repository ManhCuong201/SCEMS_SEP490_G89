using AutoMapper;
using SCEMS.Application.Services;
using SCEMS.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace SCEMS.Application;

public static class ApplicationServiceRegistration
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(ApplicationServiceRegistration).Assembly);
        
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IRoomService, RoomService>();
        services.AddScoped<IEquipmentTypeService, EquipmentTypeService>();

        return services;
    }
}
