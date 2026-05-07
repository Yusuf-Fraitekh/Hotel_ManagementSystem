namespace HotelManagement.Domain.Entities;

public class Room : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string BedType { get; set; } = string.Empty;
    public string ViewType { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int MaxGuests { get; set; }
    public decimal PricePerNight { get; set; }
    public string StayType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<RoomImage> Images { get; set; } = new List<RoomImage>();
    public ICollection<RoomRoomTag> RoomTags { get; set; } = new List<RoomRoomTag>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
