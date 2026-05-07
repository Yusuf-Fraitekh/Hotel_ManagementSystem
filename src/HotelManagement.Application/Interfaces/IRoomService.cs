using HotelManagement.Application.Common;
using HotelManagement.Domain.Entities;

namespace HotelManagement.Application.Interfaces;

public interface IRoomService
{
    Task<PagedResult<Room>> GetRoomsAsync(
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
        CancellationToken cancellationToken = default);

    Task<Room> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Room> CreateAsync(Room room, CancellationToken cancellationToken = default);
    Task<Room> UpdateAsync(Room room, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
