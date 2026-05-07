using HotelManagement.Application.Common;
using HotelManagement.Domain.Entities;

namespace HotelManagement.Application.Interfaces;

public interface IBookingService
{
    Task<Booking> CreateAsync(Booking booking, CancellationToken cancellationToken = default);
    Task<Booking> ExtendAsync(int bookingId, int userId, DateOnly newCheckoutDate, CancellationToken cancellationToken = default);
    Task<Booking> CancelAsync(int bookingId, int userId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<PagedResult<Booking>> GetUserBookingsAsync(int userId, string? sort, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PagedResult<Booking>> GetAllBookingsAsync(string? search, string? sort, int page, int pageSize, CancellationToken cancellationToken = default);
    Task DeleteAsync(int bookingId, CancellationToken cancellationToken = default);
}
