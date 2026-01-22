using Microsoft.EntityFrameworkCore;
using SCEMS.Domain.Entities;
using SCEMS.Infrastructure.DbContext;
using SCEMS.Infrastructure.Repositories.Base;

namespace SCEMS.Infrastructure.Repositories;

public class AccountRepository : GenericRepository<Account>, IAccountRepository
{
    public AccountRepository(ScemsDbContext context) : base(context) { }

    public async Task<Account?> GetByEmailAsync(string email)
    {
        return await _context.Accounts.FirstOrDefaultAsync(a => a.Email == email);
    }
}
