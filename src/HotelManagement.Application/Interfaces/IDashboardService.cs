namespace HotelManagement.Application.Interfaces;

public interface IDashboardService
{
    Task<(decimal totalRevenue, int totalBookings, int activeRooms, int totalGuests)> GetSummaryAsync(CancellationToken cancellationToken = default);
}
