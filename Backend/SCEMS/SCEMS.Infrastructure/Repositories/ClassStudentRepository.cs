using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public class ClassStudentRepository : GenericRepository<ClassStudent>, IClassStudentRepository
{
    public ClassStudentRepository(ScemsDbContext context) : base(context)
    {
    }
}
