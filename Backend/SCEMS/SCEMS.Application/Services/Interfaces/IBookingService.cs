using SCEMS.Application.Common;
using SCEMS.Application.DTOs.Booking;
using SCEMS.Domain.Enums;

namespace SCEMS.Application.Services.Interfaces;

public interface IBookingService
{
    Task<PaginatedResult<BookingResponseDto>> GetBookingsAsync(PaginationParams @params, Guid? userId = null);
    Task<BookingResponseDto?> GetBookingByIdAsync(Guid id);
    Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, Guid userId);
    Task<BookingResponseDto?> UpdateStatusAsync(Guid id, BookingStatus status);
    Task<List<BookingResponseDto>> GetRoomScheduleAsync(Guid roomId, DateTime startDate, DateTime endDate);
}
