using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Entities;
using HotelManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Services;

public class HotelInfoService : IHotelInfoService
{
    private readonly AppDbContext _dbContext;

    public HotelInfoService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<HotelInfo> GetAsync(CancellationToken cancellationToken = default)
    {
        var info = await _dbContext.HotelInfos.FirstOrDefaultAsync(cancellationToken);
        if (info is not null)
        {
            return info;
        }

        info = new HotelInfo
        {
            Name = "QuickStay Hotel",
            City = "Cairo",
            Country = "Egypt",
            Email = "info@quickstay.com"
        };
        await _dbContext.HotelInfos.AddAsync(info, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return info;
    }

    public async Task<HotelInfo> UpdateAsync(string name, string city, string country, string email, CancellationToken cancellationToken = default)
    {
        var info = await GetAsync(cancellationToken);
        info.Name = name.Trim();
        info.City = city.Trim();
        info.Country = country.Trim();
        info.Email = email.Trim().ToLowerInvariant();
        info.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return info;
    }
}
