using AutoMapper;
using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Account;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Entities;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using System.Security.Cryptography;
using System.Text;

namespace SCEMS.Application.Services;

public class AccountService : IAccountService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AccountService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaginatedAccountsDto> GetAccountsAsync(PaginationParams @params)
    {
        var query = _unitOfWork.Accounts.GetAll();

        if (!string.IsNullOrWhiteSpace(@params.Search))
        {
            var search = @params.Search.ToLowerInvariant();
            query = query.Where(a => a.FullName.ToLower().Contains(search) || a.Email.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(@params.SortBy))
        {
            query = @params.SortBy.ToLowerInvariant() switch
            {
                "name" => query.OrderBy(a => a.FullName),
                "email" => query.OrderBy(a => a.Email),
                "recent" => query.OrderByDescending(a => a.CreatedAt),
                _ => query.OrderBy(a => a.FullName)
            };
        }
        else
        {
            query = query.OrderByDescending(a => a.CreatedAt);
        }

        var total = query.Count();
        var items = query
            .Skip((@params.PageIndex - 1) * @params.PageSize)
            .Take(@params.PageSize)
            .ToList();

        var dtos = _mapper.Map<List<AccountResponseDto>>(items);

        return new PaginatedAccountsDto
        {
            Items = dtos,
            Total = total,
            PageIndex = @params.PageIndex,
            PageSize = @params.PageSize
        };
    }

    public async Task<AccountResponseDto?> GetAccountByIdAsync(Guid id)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(id);
        return account != null ? _mapper.Map<AccountResponseDto>(account) : null;
    }

    public async Task<AccountResponseDto> CreateAccountAsync(CreateAccountDto dto)
    {
        var existingAccount = await _unitOfWork.Accounts.GetByEmailAsync(dto.Email);
        if (existingAccount != null)
        {
            throw new InvalidOperationException($"Account with email {dto.Email} already exists");
        }

        var account = new Account
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Role = dto.Role,
            Status = AccountStatus.Active,
            StudentCode = dto.StudentCode,
            PasswordHash = HashPassword(dto.Password)
        };

        await _unitOfWork.Accounts.AddAsync(account);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<AccountResponseDto>(account);
    }

    public async Task<AccountResponseDto?> UpdateAccountAsync(Guid id, UpdateAccountDto dto)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(id);
        if (account == null)
        {
            return null;
        }

        if (account.Email == "admin@scems.com")
        {
            throw new InvalidOperationException("Cannot modify system account");
        }

        var existingEmail = await _unitOfWork.Accounts.GetByEmailAsync(dto.Email);
        if (existingEmail != null && existingEmail.Id != id)
        {
            throw new InvalidOperationException($"Account with email {dto.Email} already exists");
        }

        account.FullName = dto.FullName;
        account.Email = dto.Email;
        account.Phone = dto.Phone;
        account.Role = dto.Role;
        account.StudentCode = dto.StudentCode;

        _unitOfWork.Accounts.Update(account);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<AccountResponseDto>(account);
    }

    public async Task<bool> DeleteAccountAsync(Guid id)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(id);
        if (account == null)
        {
            return false;
        }

        // Prevent deletion of system account
        if (account.Email == "admin@scems.com")
        {
            throw new InvalidOperationException("Cannot delete system account");
        }

        _unitOfWork.Accounts.Delete(account);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateStatusAsync(Guid id, int status)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(id);
        if (account == null)
        {
            return false;
        }

        if (account.Email == "admin@scems.com")
        {
             throw new InvalidOperationException("Cannot change status of system account");
        }

        account.Status = (AccountStatus)status;
        _unitOfWork.Accounts.Update(account);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    private static string HashPassword(string password)
    {
        var salt = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }

        var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(20);

        var hashBytes = new byte[36];
        Array.Copy(salt, 0, hashBytes, 0, 16);
        Array.Copy(hash, 0, hashBytes, 16, 20);

        return Convert.ToBase64String(hashBytes);
    }
}
