using Microsoft.AspNetCore.Mvc;
using SCEMS.Application.Common.Interfaces;
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


}

public class LoginRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}
