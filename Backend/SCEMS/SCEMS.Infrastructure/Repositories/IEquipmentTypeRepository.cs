using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public interface IEquipmentTypeRepository : IGenericRepository<EquipmentType>
{
    Task<EquipmentType?> GetByNameAsync(string name);
}
