using HotelManagement.Domain.Enums;

namespace HotelManagement.Domain.Entities;

public class Booking : BaseEntity
{
    public int UserId { get; set; }
    public int RoomId { get; set; }
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int GuestsCount { get; set; }
    public string StayType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;

    public User User { get; set; } = null!;
    public Room Room { get; set; } = null!;
}
