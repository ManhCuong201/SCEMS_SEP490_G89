using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public interface IAccountRepository : IGenericRepository<Account>
{
    Task<Account?> GetByEmailAsync(string email);
}
