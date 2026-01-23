using Microsoft.AspNetCore.Mvc;
using SCEMS.Api.Services;
using SCEMS.Infrastructure.Repositories;
using System.Security.Cryptography;
using System.Text;

namespace SCEMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;

    public AuthController(IUnitOfWork unitOfWork, IJwtService jwtService)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        var account = await _unitOfWork.Accounts.GetByEmailAsync(request.Email);
        if (account == null || !VerifyPassword(request.Password, account.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        if (account.Status == SCEMS.Domain.Enums.AccountStatus.Blocked)
        {
             return Unauthorized(new { message = "Account is blocked" });
        }

        var token = _jwtService.GenerateToken(account);

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

    private static bool VerifyPassword(string password, string hash)
    {
        var hashBytes = Convert.FromBase64String(hash);
        var salt = new byte[16];
        Array.Copy(hashBytes, 0, salt, 0, 16);

        var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
        var hash2 = pbkdf2.GetBytes(20);

        for (int i = 0; i < 20; i++)
        {
            if (hashBytes[i + 16] != hash2[i])
                return false;
        }

        return true;
    }
}

public class LoginRequest
{
    public string Email { get; set; }
    public string Password { get; set; }
}
