using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Account;

namespace SCEMS.Application.Services.Interfaces;

public interface IAccountService
{
    Task<PaginatedAccountsDto> GetAccountsAsync(PaginationParams @params);
    Task<AccountResponseDto?> GetAccountByIdAsync(Guid id);
    Task<AccountResponseDto> CreateAccountAsync(CreateAccountDto dto);
    Task<AccountResponseDto?> UpdateAccountAsync(Guid id, UpdateAccountDto dto);
    Task<bool> DeleteAccountAsync(Guid id);
    Task<bool> UpdateStatusAsync(Guid id, int status);
}
