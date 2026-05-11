using HotelManagement.Application.Common;
using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Entities;
using HotelManagement.Domain.Enums;
using HotelManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        await _dbContext.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
        ?? throw new AppException("User not found.", 404);

    public async Task<User> UpdateProfileAsync(int id, string fullName, string? phone, CancellationToken cancellationToken = default)
    {
        var user = await GetByIdAsync(id, cancellationToken);
        user.FullName = fullName.Trim();
        user.Phone = phone;
        user.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<IReadOnlyList<User>> GetGuestsAsync(string? search, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Users.Where(x => x.Role == UserRole.User && x.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.FullName.Contains(search) || x.Email.Contains(search));
        }

        return await query.OrderBy(x => x.FullName).ToListAsync(cancellationToken);
    }
}
