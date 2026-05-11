using HotelManagement.Domain.Entities;

namespace HotelManagement.Application.Interfaces;

public interface IJwtTokenService
{
    (string token, DateTime expiresAt) GenerateToken(User user);
}
