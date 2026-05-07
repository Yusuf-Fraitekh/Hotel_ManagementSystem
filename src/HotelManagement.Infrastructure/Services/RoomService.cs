using HotelManagement.Application.Common;
using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Entities;
using HotelManagement.Domain.Enums;
using HotelManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public class RoomService : IRoomService
{
    private readonly AppDbContext _dbContext;

    public RoomService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<Room>> GetRoomsAsync(
        DateOnly? checkIn,
        DateOnly? checkOut,
        int? guests,
        string? type,
        string? bed,
        string? view,
        int? floor,
        string? stayType,
        string? tag,
        decimal? priceMin,
        decimal? priceMax,
        string? sort,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Rooms
            .Include(x => x.Images)
            .Include(x => x.RoomTags).ThenInclude(x => x.RoomTag)
            .Where(x => x.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(x => x.Type == type);
        if (!string.IsNullOrWhiteSpace(bed)) query = query.Where(x => x.BedType == bed);
        if (!string.IsNullOrWhiteSpace(view)) query = query.Where(x => x.ViewType == view);
        if (floor.HasValue) query = query.Where(x => x.Floor == floor.Value);
        if (!string.IsNullOrWhiteSpace(stayType)) query = query.Where(x => x.StayType == stayType);
        if (!string.IsNullOrWhiteSpace(tag)) query = query.Where(x => x.RoomTags.Any(t => t.RoomTag.Name == tag));
        if (guests.HasValue) query = query.Where(x => x.MaxGuests >= guests.Value);
        if (priceMin.HasValue) query = query.Where(x => x.PricePerNight >= priceMin.Value);
        if (priceMax.HasValue) query = query.Where(x => x.PricePerNight <= priceMax.Value);

        if (checkIn.HasValue && checkOut.HasValue)
        {
            query = query.Where(r => !r.Bookings.Any(b =>
                b.Status == BookingStatus.Confirmed &&
                checkIn.Value < b.CheckOutDate &&
                checkOut.Value > b.CheckInDate));
        }

        query = sort switch
        {
            "priceLow" => query.OrderBy(x => x.PricePerNight),
            "priceHigh" => query.OrderByDescending(x => x.PricePerNight),
            _ => query.OrderBy(x => x.Id)
        };

        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        return new PagedResult<Room> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<Room> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _dbContext.Rooms
            .Include(x => x.Images)
            .Include(x => x.RoomTags).ThenInclude(x => x.RoomTag)
            .FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken)
        ?? throw new AppException("Room not found.", 404);

    public async Task<Room> CreateAsync(Room room, CancellationToken cancellationToken = default)
    {
        await _dbContext.Rooms.AddAsync(room, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return room;
    }

    public async Task<Room> UpdateAsync(Room room, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Rooms
            .Include(x => x.Images)
            .Include(x => x.RoomTags)
            .FirstOrDefaultAsync(x => x.Id == room.Id, cancellationToken)
            ?? throw new AppException("Room not found.", 404);

        existing.Name = room.Name;
        existing.Type = room.Type;
        existing.BedType = room.BedType;
        existing.ViewType = room.ViewType;
        existing.Floor = room.Floor;
        existing.MaxGuests = room.MaxGuests;
        existing.PricePerNight = room.PricePerNight;
        existing.StayType = room.StayType;
        existing.Description = room.Description;
        existing.UpdatedAt = DateTime.UtcNow;

        existing.Images.Clear();
        foreach (var image in room.Images)
        {
            existing.Images.Add(new RoomImage { ImageUrl = image.ImageUrl, SortOrder = image.SortOrder });
        }

        existing.RoomTags.Clear();
        foreach (var roomTag in room.RoomTags)
        {
            if (roomTag.RoomTagId > 0)
            {
                existing.RoomTags.Add(new RoomRoomTag { RoomTagId = roomTag.RoomTagId, RoomId = existing.Id });
                continue;
            }

            var tagName = roomTag.RoomTag?.Name?.Trim();
            if (string.IsNullOrWhiteSpace(tagName))
            {
                continue;
            }

            var existingTag = await _dbContext.RoomTags.FirstOrDefaultAsync(x => x.Name == tagName, cancellationToken);
            if (existingTag is null)
            {
                existingTag = new RoomTag { Name = tagName };
                _dbContext.RoomTags.Add(existingTag);
            }

            existing.RoomTags.Add(new RoomRoomTag { RoomTag = existingTag, RoomId = existing.Id });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var room = await _dbContext.Rooms.FindAsync([id], cancellationToken)
                   ?? throw new AppException("Room not found.", 404);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var hasActiveBookings = await _dbContext.Bookings.AnyAsync(
            x => x.RoomId == id && x.Status == BookingStatus.Confirmed && x.CheckOutDate >= today,
            cancellationToken);
        if (hasActiveBookings)
        {
            throw new AppException("Cannot delete room with active or future bookings.", 409);
        }

        room.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
