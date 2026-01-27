using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common.Interfaces;
using SCEMS.Api.Services;
using SCEMS.Infrastructure.Repositories;
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

    public AuthController(IUnitOfWork unitOfWork, IJwtService jwtService, IPasswordHasher passwordHasher)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        var account = await _unitOfWork.Accounts.GetByEmailOrCodeAsync(request.Email);
        if (account == null || account.PasswordHash == null || !_passwordHasher.VerifyPassword(request.Password, account.PasswordHash))
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
                return Unauthorized(new { message = "Account not found. Please contact Admin to register." });
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
