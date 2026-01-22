using SCEMS.Domain.Entities;

namespace SCEMS.Infrastructure.Repositories.Base;

public interface IGenericRepository<T> where T : BaseEntity
{
    IQueryable<T> GetAll();
    Task<T?> GetByIdAsync(Guid id);
    Task AddAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
    Task SaveChangesAsync();
}
