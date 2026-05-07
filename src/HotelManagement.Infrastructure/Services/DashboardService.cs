using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Enums;
using HotelManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _dbContext;

    public DashboardService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<(decimal totalRevenue, int totalBookings, int activeRooms, int totalGuests)> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var confirmedBookings = _dbContext.Bookings
            .Include(x => x.Room)
            .Where(x => x.Status == BookingStatus.Confirmed);

        var totalRevenue = await confirmedBookings
            .SumAsync(x => (x.CheckOutDate.DayNumber - x.CheckInDate.DayNumber) * x.Room.PricePerNight, cancellationToken);

        var totalBookings = await confirmedBookings.CountAsync(cancellationToken);
        var activeRooms = await _dbContext.Rooms.CountAsync(x => x.IsActive, cancellationToken);
        var totalGuests = await confirmedBookings.SumAsync(x => x.GuestsCount, cancellationToken);

        return (totalRevenue, totalBookings, activeRooms, totalGuests);
    }
}
