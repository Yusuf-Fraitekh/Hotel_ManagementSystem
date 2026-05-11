using HotelManagement.Api.DTOs.Admin;
using HotelManagement.Api.DTOs.Auth;
using HotelManagement.Api.DTOs.Bookings;
using HotelManagement.Api.DTOs.Rooms;
using HotelManagement.Domain.Entities;

namespace HotelManagement.Api.Common;

public static class MappingExtensions
{
    public static UserProfileDto ToProfileDto(this User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role.ToString(),
        Phone = user.Phone
    };

    public static RoomResponseDto ToRoomDto(this Room room) => new()
    {
        Id = room.Id,
        Name = room.Name,
        Type = room.Type,
        BedType = room.BedType,
        ViewType = room.ViewType,
        Floor = room.Floor,
        MaxGuests = room.MaxGuests,
        PricePerNight = room.PricePerNight,
        StayType = room.StayType,
        Description = room.Description,
        Tags = room.RoomTags.Select(x => x.RoomTag.Name).ToList(),
        Images = room.Images.OrderBy(x => x.SortOrder).Select(x => x.ImageUrl).ToList()
    };

    public static BookingResponseDto ToBookingDto(this Booking booking) => new()
    {
        Id = booking.Id,
        UserId = booking.UserId,
        UserName = booking.User?.FullName ?? string.Empty,
        RoomId = booking.RoomId,
        RoomName = booking.Room?.Name ?? string.Empty,
        CheckInDate = booking.CheckInDate,
        CheckOutDate = booking.CheckOutDate,
        GuestsCount = booking.GuestsCount,
        StayType = booking.StayType,
        PricePerNight = booking.Room?.PricePerNight ?? 0,
        Total = (booking.CheckOutDate.DayNumber - booking.CheckInDate.DayNumber) * (booking.Room?.PricePerNight ?? 0),
        Status = booking.Status.ToString(),
        Notes = booking.Notes,
        CreatedAt = booking.CreatedAt
    };

    public static GuestListItemDto ToGuestDto(this User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone
    };
}
