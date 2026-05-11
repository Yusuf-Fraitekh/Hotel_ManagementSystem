using HotelManagement.Domain.Entities;

namespace HotelManagement.Application.Interfaces;

public interface IUserService
{
    Task<User> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<User> UpdateProfileAsync(int id, string fullName, string? phone, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<User>> GetGuestsAsync(string? search, CancellationToken cancellationToken = default);
}
