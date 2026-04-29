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
        var configService = scope.ServiceProvider.GetRequiredService<IConfigurationService>();

        var now = DateTime.Now;
        var autoLockEnabled = await configService.GetValueAsync("Classroom.AutoLock", "true") == "true";
        
        // 1. Find pending bookings that have already ended
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
        }

        // 2. Handle AutoLock for finished bookings
        if (autoLockEnabled)
        {
            // Find bookings that ended in the last 30 minutes and are Approved
            // We lock the room once the booking is finished
            var recentlyFinished = await unitOfWork.Bookings.GetAll()
                .Include(b => b.Room)
                .Where(b => b.Status == BookingStatus.Approved)
                .ToListAsync();
            
            var roomsToLock = recentlyFinished
                .Where(b => b.TimeSlot.AddHours(b.Duration) <= now && b.TimeSlot.AddHours(b.Duration) > now.AddMinutes(-30))
                .Select(b => b.Room)
                .Where(r => r != null && r.Status == RoomStatus.Available)
                .DistinctBy(r => r.Id)
                .ToList();

            if (roomsToLock.Any())
            {
                _logger.LogInformation("Auto-locking {Count} rooms after booking end.", roomsToLock.Count);
                foreach (var room in roomsToLock)
                {
                    room.Status = RoomStatus.Disabled; // Using Disabled as "Locked" for now
                    unitOfWork.Rooms.Update(room);
                }
            }
        }

        await unitOfWork.SaveChangesAsync();
    }
}
