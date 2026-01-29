using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public class ClassRepository : GenericRepository<Class>, IClassRepository
{
    public ClassRepository(ScemsDbContext context) : base(context)
    {
    }
}
