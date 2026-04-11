using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SCEMS.Application.Services.Interfaces;
using SCEMS.Domain.Enums;
using SCEMS.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace SCEMS.Api.Services;

public class BookingCleanupWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingCleanupWorker> _logger;

    public BookingCleanupWorker(IServiceProvider serviceProvider, ILogger<BookingCleanupWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Booking Cleanup Worker starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoCleanupAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during booking cleanup.");
            }

            // Run every 15 minutes
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }

    private async Task DoCleanupAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var now = DateTime.Now;
        
        // Find pending bookings that have already ended
        var expiredPending = await unitOfWork.Bookings.GetAll()
            .Where(b => b.Status == BookingStatus.Pending)
            .ToListAsync();

        var toReject = expiredPending.Where(b => b.TimeSlot.AddHours(b.Duration) < now).ToList();

        if (toReject.Any())
        {
            _logger.LogInformation("Rejecting {Count} expired pending bookings.", toReject.Count);
            foreach (var b in toReject)
            {
                b.Status = BookingStatus.Rejected;
                b.RejectReason = "Tự động từ chối do đã hết thời gian yêu cầu.";
                unitOfWork.Bookings.Update(b);
            }
            await unitOfWork.SaveChangesAsync();
        }
    }
}
