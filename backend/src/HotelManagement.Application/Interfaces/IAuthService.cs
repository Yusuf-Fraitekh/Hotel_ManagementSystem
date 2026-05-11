using HotelManagement.Domain.Entities;

namespace HotelManagement.Application.Interfaces;

public interface IAuthService
{
    Task<(string token, DateTime expiresAt, User user)> RegisterAsync(
        string fullName,
        string email,
        string password,
        string? phone,
        CancellationToken cancellationToken = default);

    Task<(string token, DateTime expiresAt, User user)> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);
}
