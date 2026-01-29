using System;
using System.Linq;
using System.Threading.Tasks;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public interface IEquipmentTypeRepository : IGenericRepository<EquipmentType>
{
    Task<EquipmentType?> GetByNameAsync(string name);
    IQueryable<EquipmentType> GetAllWithDetails();
    Task<EquipmentType?> GetByIdWithDetailsAsync(Guid id);
}
