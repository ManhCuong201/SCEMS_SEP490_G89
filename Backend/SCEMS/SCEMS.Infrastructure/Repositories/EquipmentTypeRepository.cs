using Microsoft.EntityFrameworkCore;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public class EquipmentTypeRepository : GenericRepository<EquipmentType>, IEquipmentTypeRepository
{
    public EquipmentTypeRepository(ScemsDbContext context) : base(context) { }

    public async Task<EquipmentType?> GetByNameAsync(string name)
    {
        return await _context.EquipmentTypes.FirstOrDefaultAsync(et => et.Name == name);
    }
}
