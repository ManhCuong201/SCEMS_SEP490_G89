using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Extensions;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<ScemsDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IAccountRepository, AccountRepository>();
        services.AddScoped<IRoomRepository, RoomRepository>();
        services.AddScoped<IEquipmentTypeRepository, EquipmentTypeRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
