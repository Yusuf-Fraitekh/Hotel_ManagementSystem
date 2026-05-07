using HotelManagement.Application.Common;
using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Entities;
using HotelManagement.Domain.Enums;
using HotelManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _dbContext;

    public BookingService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Booking> CreateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        if (booking.CheckOutDate <= booking.CheckInDate)
        {
            throw new AppException("Checkout date must be after checkin date.", 400);
        }

        var room = await _dbContext.Rooms.FirstOrDefaultAsync(x => x.Id == booking.RoomId && x.IsActive, cancellationToken)
                   ?? throw new AppException("Room not found.", 404);
        if (booking.GuestsCount > room.MaxGuests)
        {
            throw new AppException("Guests count exceeds room capacity.", 400);
        }

        var overlap = await _dbContext.Bookings.AnyAsync(x =>
            x.RoomId == booking.RoomId &&
            x.Status == BookingStatus.Confirmed &&
            booking.CheckInDate < x.CheckOutDate &&
            booking.CheckOutDate > x.CheckInDate, cancellationToken);
        if (overlap)
        {
            throw new AppException("Selected dates are not available.", 409);
        }

        await _dbContext.Bookings.AddAsync(booking, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return booking;
    }

    public async Task<Booking> ExtendAsync(int bookingId, int userId, DateOnly newCheckoutDate, CancellationToken cancellationToken = default)
    {
        var booking = await _dbContext.Bookings.FirstOrDefaultAsync(x => x.Id == bookingId && x.UserId == userId, cancellationToken)
                      ?? throw new AppException("Booking not found.", 404);
        if (newCheckoutDate <= booking.CheckOutDate)
        {
            throw new AppException("New checkout date must be later than current checkout date.", 400);
        }

        var overlap = await _dbContext.Bookings.AnyAsync(x =>
            x.RoomId == booking.RoomId &&
            x.Id != booking.Id &&
            x.Status == BookingStatus.Confirmed &&
            booking.CheckInDate < x.CheckOutDate &&
            newCheckoutDate > x.CheckInDate, cancellationToken);
        if (overlap)
        {
            throw new AppException("Cannot extend booking due to date conflict.", 409);
        }

        booking.CheckOutDate = newCheckoutDate;
        booking.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return booking;
    }

    public async Task<Booking> CancelAsync(int bookingId, int userId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var booking = await _dbContext.Bookings.FirstOrDefaultAsync(x => x.Id == bookingId, cancellationToken)
                      ?? throw new AppException("Booking not found.", 404);

        if (!isAdmin && booking.UserId != userId)
        {
            throw new AppException("You are not allowed to cancel this booking.", 403);
        }

        if (!isAdmin)
        {
            var cutoff = booking.CheckInDate.ToDateTime(TimeOnly.MinValue).AddHours(-48);
            if (DateTime.UtcNow > cutoff)
            {
                throw new AppException("Booking cannot be cancelled less than 48 hours before check-in.", 400);
            }
        }

        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return booking;
    }

    public async Task<PagedResult<Booking>> GetUserBookingsAsync(int userId, string? sort, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Bookings
            .Include(x => x.Room)
            .Where(x => x.UserId == userId)
            .AsQueryable();

        query = sort switch
        {
            "oldest" => query.OrderBy(x => x.CreatedAt),
            "priceHigh" => query.OrderByDescending(x => x.Room.PricePerNight),
            "priceLow" => query.OrderBy(x => x.Room.PricePerNight),
            _ => query.OrderByDescending(x => x.CreatedAt)
        };

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<Booking> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<PagedResult<Booking>> GetAllBookingsAsync(string? search, string? sort, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Bookings
            .Include(x => x.User)
            .Include(x => x.Room)
            .AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.User.FullName.Contains(search) ||
                x.User.Email.Contains(search) ||
                x.Room.Name.Contains(search) ||
                x.Id.ToString().Contains(search));
        }

        query = sort switch
        {
            "oldest" => query.OrderBy(x => x.CreatedAt),
            _ => query.OrderByDescending(x => x.CreatedAt)
        };

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<Booking> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task DeleteAsync(int bookingId, CancellationToken cancellationToken = default)
    {
        var booking = await _dbContext.Bookings.FindAsync([bookingId], cancellationToken)
                      ?? throw new AppException("Booking not found.", 404);
        _dbContext.Bookings.Remove(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
