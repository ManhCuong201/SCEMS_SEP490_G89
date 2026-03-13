using SCEMS.Application.DTOs.Profile;

namespace SCEMS.Application.Services.Interfaces;

public interface IProfileService
{
    Task<ProfileResponseDto?> GetProfileAsync(Guid userId);
    Task<ProfileResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
}
