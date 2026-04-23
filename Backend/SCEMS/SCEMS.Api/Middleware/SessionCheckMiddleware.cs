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
            var roleClaim = user.FindFirst(ClaimTypes.Role)?.Value;
            if (roleClaim == AccountRole.BookingStaff.ToString())
            {
                var sidClaim = user.FindFirst("sid")?.Value;
                if (string.IsNullOrEmpty(sidClaim))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(new { message = "Phiên làm việc không hợp lệ." });
                    return;
                }

                // Use service to check global session ID
                using var scope = context.RequestServices.CreateScope();
                var configService = scope.ServiceProvider.GetRequiredService<IConfigurationService>();
                var activeSessionId = await configService.GetValueAsync("Security.ActiveBookingStaffSessionId", "");

                if (sidClaim != activeSessionId)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(new { 
                        message = "Một nhân viên quản lý đặt phòng khác đã đăng nhập. Bạn đã bị đăng xuất để tránh xung đột dữ liệu.",
                        code = "SESSION_INVALIDATED"
                    });
                    return;
                }
            }
        }

        await _next(context);
    }
}
