using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common.Interfaces;
using SCEMS.Api.Services;
using SCEMS.Infrastructure.Repositories;
using SCEMS.Application.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IClassService _classService;
    private readonly IConfigurationService _configurationService;
    private readonly INotificationDispatcher _notificationDispatcher;

    public AuthController(
        IUnitOfWork unitOfWork, 
        IJwtService jwtService, 
        IPasswordHasher passwordHasher, 
        IClassService classService,
        IConfigurationService configurationService,
        INotificationDispatcher notificationDispatcher)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _classService = classService;
        _configurationService = configurationService;
        _notificationDispatcher = notificationDispatcher;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        var account = await _unitOfWork.Accounts.GetByEmailOrCodeAsync(request.Email);
        
        if (account != null)
        {
            if (account.Status == SCEMS.Domain.Enums.AccountStatus.Blocked)
            {
                return Unauthorized(new { message = "Tài khoản đã bị khóa vĩnh viễn bởi quản trị viên." });
            }

            if (account.LockoutEnd.HasValue && account.LockoutEnd > DateTime.Now)
            {
                var remainingMinutes = Math.Ceiling((account.LockoutEnd.Value - DateTime.Now).TotalMinutes);
                return Unauthorized(new { message = $"Tài khoản bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau {remainingMinutes} phút." });
            }
        }

        if (account == null || account.PasswordHash == null || !_passwordHasher.VerifyPassword(request.Password, account.PasswordHash))
        {
            if (account != null)
            {
                account.FailedLoginAttempts++;
                var maxAttempts = await _configurationService.GetValueAsync("Security.MaxLoginAttempts", 5);
                
                if (account.FailedLoginAttempts >= maxAttempts)
                {
                    account.LockoutEnd = DateTime.Now.AddMinutes(30);
                    account.FailedLoginAttempts = 0;
                }
                
                _unitOfWork.Accounts.Update(account);
                await _unitOfWork.SaveChangesAsync();

                if (account.LockoutEnd.HasValue)
                {
                    return Unauthorized(new { message = "Bạn đã nhập sai quá nhiều lần. Tài khoản bị tạm khóa trong 30 phút." });
                }
            }
            return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác." });
        }

        // Reset failed attempts on success
        if (account.FailedLoginAttempts > 0 || account.LockoutEnd.HasValue)
        {
            account.FailedLoginAttempts = 0;
            account.LockoutEnd = null;
            _unitOfWork.Accounts.Update(account);
            await _unitOfWork.SaveChangesAsync();
        }

        // Handle Single Session for All Roles
        var newSessionId = Guid.NewGuid().ToString();
        
        // Send ForceLogout to previous active session if exists
        if (!string.IsNullOrEmpty(account.CurrentSessionId))
        {
            await _notificationDispatcher.DispatchLogoutSignalAsync(account.Id);
        }

        if (account.Role == SCEMS.Domain.Enums.AccountRole.BookingStaff)
        {
            // Specifically for BookingStaff, we still update global settings for extra safety in middleware
            await _configurationService.UpdateSettingAsync("Security.ActiveBookingStaffSessionId", newSessionId);
            await _configurationService.UpdateSettingAsync("Security.ActiveBookingStaffId", account.Id.ToString());
        }

        account.CurrentSessionId = newSessionId;
        _unitOfWork.Accounts.Update(account);
        await _unitOfWork.SaveChangesAsync();

        var token = await _jwtService.GenerateTokenAsync(account);

        return Ok(new
        {
            token,
            expiresIn = 900,
            id = account.Id,
            role = account.Role.ToString(),
            email = account.Email,
            fullName = account.FullName
        });
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            // PLACEHOLDER: Decode token without signature validation (Insecure! For Dev Only w/o Client ID)
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(request.Token);
            var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;

            if (string.IsNullOrEmpty(emailClaim))
            {
                return BadRequest(new { message = "Invalid Google Token: Email not found." });
            }

            var account = await _unitOfWork.Accounts.GetByEmailOrCodeAsync(emailClaim);
            if (account == null)
            {
                // Auto-Registration Logic
                var emailParts = emailClaim.Split('@');
                var username = emailParts[0];
                var domain = emailParts.Length > 1 ? emailParts[1].ToLower() : "";

                SCEMS.Domain.Enums.AccountRole role;
                string? studentCode = null;

                if (domain == "fpt.edu.vn")
                {
                    // Check for student pattern: ends with 2 letters + digits (e.g. cuongvmhe173561)
                    var match = System.Text.RegularExpressions.Regex.Match(username, @"([a-zA-Z]{2}\d+)$");
                    if (match.Success)
                    {
                        role = SCEMS.Domain.Enums.AccountRole.Student;
                        studentCode = match.Groups[1].Value.ToUpper();
                    }
                    else
                    {
                        // Default to Lecturer for other fpt.edu.vn emails
                        role = SCEMS.Domain.Enums.AccountRole.Lecturer;
                    }
                }
                else if (domain == "fe.edu.vn")
                {
                    // fe.edu.vn is typically Lecturers/Staff
                    role = SCEMS.Domain.Enums.AccountRole.Lecturer;
                }
                else
                {
                    return Unauthorized(new { message = "Only @fpt.edu.vn and @fe.edu.vn emails are allowed." });
                }

                var nameClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value 
                                ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "given_name")?.Value
                                ?? username;

                account = new SCEMS.Domain.Entities.Account
                {
                    Email = emailClaim,
                    FullName = nameClaim,
                    Role = role,
                    Status = SCEMS.Domain.Enums.AccountStatus.Active,
                    StudentCode = studentCode
                };

                await _unitOfWork.Accounts.AddAsync(account);
                await _unitOfWork.SaveChangesAsync();

                // Link pending enrollments for new students
                if (role == SCEMS.Domain.Enums.AccountRole.Student)
                {
                    await _classService.LinkPendingEnrollmentsAsync(account.Id, account.Email, account.StudentCode);
                }
            }

            if (account.Status == SCEMS.Domain.Enums.AccountStatus.Blocked)
            {
                return Unauthorized(new { message = "Account is blocked" });
            }

            // Handle Single Session for All Roles
            var newSessionId = Guid.NewGuid().ToString();
            
            // Send ForceLogout to previous active session if exists
            if (!string.IsNullOrEmpty(account.CurrentSessionId))
            {
                await _notificationDispatcher.DispatchLogoutSignalAsync(account.Id);
            }

            if (account.Role == SCEMS.Domain.Enums.AccountRole.BookingStaff)
            {
                // Specifically for BookingStaff, we still update global settings for extra safety in middleware
                await _configurationService.UpdateSettingAsync("Security.ActiveBookingStaffSessionId", newSessionId);
                await _configurationService.UpdateSettingAsync("Security.ActiveBookingStaffId", account.Id.ToString());
            }

            account.CurrentSessionId = newSessionId;
            _unitOfWork.Accounts.Update(account);
            await _unitOfWork.SaveChangesAsync();

            var token = await _jwtService.GenerateTokenAsync(account);

            return Ok(new
            {
                token,
                expiresIn = 900,
                id = account.Id,
                role = account.Role.ToString(),
                email = account.Email,
                fullName = account.FullName
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Failed to process Google Token: " + ex.Message });
        }
    }
}

public class GoogleLoginRequest
{
    public required string Token { get; set; }
}

public class LoginRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}
