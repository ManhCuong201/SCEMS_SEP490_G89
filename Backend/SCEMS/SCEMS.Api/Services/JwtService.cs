using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SCEMS.Domain.Entities;

using SCEMS.Application.Services.Interfaces;

namespace SCEMS.Api.Services;

public interface IJwtService
{
    Task<string> GenerateTokenAsync(Account account);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly IConfigurationService _configService;

    public JwtService(IConfiguration configuration, IConfigurationService configService)
    {
        _configuration = configuration;
        _configService = configService;
    }

    public async Task<string> GenerateTokenAsync(Account account)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var timeoutMinutes = await _configService.GetValueAsync("Security.SessionTimeoutMinutes", 60);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, account.Id.ToString()),
            new Claim(ClaimTypes.Email, account.Email),
            new Claim(ClaimTypes.Role, account.Role.ToString()),
            new Claim("FullName", account.FullName),
            new Claim("sid", account.CurrentSessionId ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(timeoutMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
