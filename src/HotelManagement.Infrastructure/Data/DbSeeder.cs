using HotelManagement.Domain.Entities;
using HotelManagement.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext)
    {
        await dbContext.Database.MigrateAsync();

        if (!await dbContext.Users.AnyAsync(x => x.Role == UserRole.Admin))
        {
            var admin = new User
            {
                FullName = "System Admin",
                Email = "admin@quickstay.com",
                Role = UserRole.Admin,
                IsActive = true
            };
            admin.PasswordHash = new PasswordHasher<User>().HashPassword(admin, "Admin123!");
            await dbContext.Users.AddAsync(admin);
        }

        if (!await dbContext.Rooms.AnyAsync())
        {
            await SeedDefaultRoomsAsync(dbContext);
        }

        if (!await dbContext.HotelInfos.AnyAsync())
        {
            await dbContext.HotelInfos.AddAsync(new HotelInfo
            {
                Name = "QuickStay Hotel",
                City = "Cairo",
                Country = "Egypt",
                Email = "info@quickstay.com"
            });
        }

        await dbContext.SaveChangesAsync();
    }

    public static Task SeedDefaultRoomsAsync(AppDbContext dbContext)
    {
        return dbContext.Rooms.AddRangeAsync(
            new Room
            {
                Name = "Deluxe Sea View",
                Type = "suite",
                BedType = "king",
                ViewType = "sea",
                Floor = 8,
                MaxGuests = 3,
                PricePerNight = 220,
                StayType = "family",
                Description = "Spacious suite with sea view."
            },
            new Room
            {
                Name = "Business City Room",
                Type = "room",
                BedType = "double",
                ViewType = "city",
                Floor = 3,
                MaxGuests = 2,
                PricePerNight = 120,
                StayType = "business",
                Description = "Comfort room for short business stays."
            });
    }
}
