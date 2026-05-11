using HotelManagement.Domain.Entities;
using HotelManagement.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Data;

public static class DbSeeder
{
    /// <summary>
    /// Default gallery URL: file lives under Api/wwwroot/uploads and is part of the repo.
    /// Use root-relative paths so they resolve on the same host as the API (see Program static files).
    /// Avoid seeding random /uploads/{guid}.jpg values unless those files are guaranteed committed — clones would 404.
    /// </summary>
    public const string DefaultRoomImageUrl = "/uploads/room-placeholder.svg";

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
        static RoomImage Cover(int order = 0) => new() { ImageUrl = DefaultRoomImageUrl, SortOrder = order };

        return dbContext.Rooms.AddRangeAsync(
            new Room
            {
                Name = "Economy Single Room",
                Type = "room",
                BedType = "single",
                ViewType = "city",
                Floor = 2,
                MaxGuests = 1,
                PricePerNight = 85,
                StayType = "economy",
                Description = "Affordable single bed with city outlook — perfect for short stays.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Economy Single Room",
                Type = "room",
                BedType = "single",
                ViewType = "city",
                Floor = 4,
                MaxGuests = 1,
                PricePerNight = 85,
                StayType = "economy",
                Description = "Same economy layout on a higher floor with quieter corridor access.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Double Standard",
                Type = "room",
                BedType = "double",
                ViewType = "city",
                Floor = 3,
                MaxGuests = 2,
                PricePerNight = 145,
                StayType = "business",
                Description = "Standard double bed, work desk, and bright city views.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Double Standard",
                Type = "room",
                BedType = "double",
                ViewType = "city",
                Floor = 5,
                MaxGuests = 2,
                PricePerNight = 149,
                StayType = "business",
                Description = "Double standard room on a mid-level floor.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Twin Sea Breeze",
                Type = "room",
                BedType = "twin",
                ViewType = "sea",
                Floor = 6,
                MaxGuests = 2,
                PricePerNight = 175,
                StayType = "leisure",
                Description = "Twin beds and partial Red Sea breeze views from a wide window.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Twin Sea Breeze",
                Type = "room",
                BedType = "twin",
                ViewType = "sea",
                Floor = 8,
                MaxGuests = 2,
                PricePerNight = 185,
                StayType = "leisure",
                Description = "Twin configuration with improved sea-facing aspect.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Premium King Ocean",
                Type = "room",
                BedType = "king",
                ViewType = "sea",
                Floor = 12,
                MaxGuests = 2,
                PricePerNight = 295,
                StayType = "leisure",
                Description = "King bed, premium linens, and full ocean panorama.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Family City Suite",
                Type = "suite",
                BedType = "king",
                ViewType = "city",
                Floor = 10,
                MaxGuests = 4,
                PricePerNight = 385,
                StayType = "family",
                Description = "Separate living area, sofa bed, and space for families visiting the city.",
                Images = new List<RoomImage> { Cover() }
            },
            new Room
            {
                Name = "Royal Horizon Suite",
                Type = "suite",
                BedType = "king",
                ViewType = "sea",
                Floor = 16,
                MaxGuests = 4,
                PricePerNight = 595,
                StayType = "luxury",
                Description = "Top-tier suite with horizon sea views, lounge, and premium amenities.",
                Images = new List<RoomImage> { Cover() }
            });
    }
}
