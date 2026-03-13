using SCEMS.Application.Common.Interfaces;
using SCEMS.Application.DTOs.Profile;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Infrastructure.Repositories;

namespace SCEMS.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;

    public ProfileService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
    }

    public async Task<ProfileResponseDto?> GetProfileAsync(Guid userId)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
        if (account == null) return null;

        return new ProfileResponseDto
        {
            Id = account.Id,
            FullName = account.FullName,
            Email = account.Email,
            StudentCode = account.StudentCode,
            Phone = account.Phone,
            Role = account.Role.ToString()
        };
    }

    public async Task<ProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
        if (account == null) throw new InvalidOperationException("Account not found");

        account.FullName = dto.FullName;
        account.Phone = dto.Phone;
        
        _unitOfWork.Accounts.Update(account);
        await _unitOfWork.SaveChangesAsync();

        return new ProfileResponseDto
        {
            Id = account.Id,
            FullName = account.FullName,
            Email = account.Email,
            StudentCode = account.StudentCode,
            Phone = account.Phone,
            Role = account.Role.ToString()
        };
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var account = await _unitOfWork.Accounts.GetByIdAsync(userId);
        if (account == null) return false;

        if (string.IsNullOrEmpty(account.PasswordHash))
        {
            // Google Login users might not have a password yet
            // If they are trying to set one, we can bypass the "CurrentPassword" check if they never had one, OR require them to use a reset flow. 
            // For simplicity, we assume if they have no password, they can set it directly without verifying.
            if (!string.IsNullOrEmpty(dto.CurrentPassword))
            {
                // Edge case: User sent a current password, but they never had one.
                return false; 
            }
        }
        else
        {
            if (!_passwordHasher.VerifyPassword(dto.CurrentPassword, account.PasswordHash))
            {
                return false;
            }
        }

        account.PasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
        _unitOfWork.Accounts.Update(account);
        await _unitOfWork.SaveChangesAsync();
        
        return true;
    }
}
