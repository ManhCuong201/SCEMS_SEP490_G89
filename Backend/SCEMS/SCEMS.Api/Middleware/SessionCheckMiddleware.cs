using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Enums;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SCEMS.Api.Middleware;

public class SessionCheckMiddleware
{
    private readonly RequestDelegate _next;

    public SessionCheckMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var user = context.User;
        if (user.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var sidClaim = user.FindFirst("sid")?.Value;

            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                using var scope = context.RequestServices.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var account = await unitOfWork.Accounts.GetByIdAsync(userId);

                if (account == null || account.CurrentSessionId != sidClaim)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(new { 
                        message = "Phiên làm việc đã hết hạn hoặc có người khác đã đăng nhập vào tài khoản này.",
                        code = "SESSION_INVALIDATED"
                    });
                    return;
                }
            }
        }

        await _next(context);
    }
}
