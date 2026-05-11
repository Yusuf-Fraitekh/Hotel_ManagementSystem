using HotelManagement.Application.Common;
using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Entities;
using HotelManagement.Domain.Enums;
using HotelManagement.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly PasswordHasher<User> _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(AppDbContext dbContext, PasswordHasher<User> passwordHasher, IJwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<(string token, DateTime expiresAt, User user)> RegisterAsync(
        string fullName,
        string email,
        string password,
        string? phone,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var exists = await _dbContext.Users.AnyAsync(x => x.Email == normalizedEmail, cancellationToken);
        if (exists)
        {
            throw new AppException("Email is already registered.", 409);
        }

        var user = new User
        {
            FullName = fullName.Trim(),
            Email = normalizedEmail,
            Phone = phone,
            Role = UserRole.User,
            IsActive = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, password);
        await _dbContext.Users.AddAsync(user, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var (token, expiresAt) = _jwtTokenService.GenerateToken(user);
        return (token, expiresAt, user);
    }

    public async Task<(string token, DateTime expiresAt, User user)> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken)
                   ?? throw new AppException("Invalid credentials.", 401);

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed || !user.IsActive)
        {
            throw new AppException("Invalid credentials.", 401);
        }

        var (token, expiresAt) = _jwtTokenService.GenerateToken(user);
        return (token, expiresAt, user);
    }
}
