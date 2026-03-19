using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Booking;
using SCEMS.Domain.Enums;

namespace SCEMS.Application.Services.Interfaces;

public interface IBookingService
{
    Task<PaginatedResult<BookingResponseDto>> GetBookingsAsync(PaginationParams @params, Guid? userId = null);
    Task<BookingResponseDto?> GetBookingByIdAsync(Guid id);
    Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, Guid userId, bool skipDurationCheck = false, Guid? excludeScheduleId = null);
    Task<BookingResponseDto?> UpdateStatusAsync(Guid id, BookingStatus status, string? rejectReason = null);
    Task<List<BookingResponseDto>> GetRoomScheduleAsync(Guid roomId, DateTime startDate, DateTime endDate);
    Task<List<BookingResponseDto>> GetBookingsByDateAsync(DateTime date);
    Task<BookingResponseDto> CreateRoomChangeRequestAsync(CreateRoomChangeRequestDto dto, Guid userId);
    Task<BookingResponseDto> CreateScheduleChangeRequestAsync(CreateScheduleChangeRequestDto dto, Guid userId);
    Task<bool> CancelBookingAsync(Guid bookingId, Guid userId);
}
