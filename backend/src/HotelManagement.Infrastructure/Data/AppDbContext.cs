using HotelManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{

    public DbSet<User> Users => Set<User>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomImage> RoomImages => Set<RoomImage>();
    public DbSet<RoomTag> RoomTags => Set<RoomTag>();
    public DbSet<RoomRoomTag> RoomRoomTags => Set<RoomRoomTag>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<HotelInfo> HotelInfos => Set<HotelInfo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.PricePerNight).HasPrecision(18, 2);
        });

        modelBuilder.Entity<RoomImage>(entity =>
        {
            entity.Property(x => x.ImageUrl).IsRequired();
            entity.HasOne(x => x.Room).WithMany(x => x.Images).HasForeignKey(x => x.RoomId);
        });

        modelBuilder.Entity<RoomTag>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<RoomRoomTag>(entity =>
        {
            entity.HasKey(x => new { x.RoomId, x.RoomTagId });
            entity.HasOne(x => x.Room).WithMany(x => x.RoomTags).HasForeignKey(x => x.RoomId);
            entity.HasOne(x => x.RoomTag).WithMany(x => x.RoomTags).HasForeignKey(x => x.RoomTagId);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasIndex(x => new { x.RoomId, x.CheckInDate, x.CheckOutDate });
            entity.HasOne(x => x.User).WithMany(x => x.Bookings).HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.Room).WithMany(x => x.Bookings).HasForeignKey(x => x.RoomId);
        });
    }
}
