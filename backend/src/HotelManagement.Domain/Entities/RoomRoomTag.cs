namespace HotelManagement.Domain.Entities;

public class RoomRoomTag
{
    public int RoomId { get; set; }
    public int RoomTagId { get; set; }

    public Room Room { get; set; } = null!;
    public RoomTag RoomTag { get; set; } = null!;
}
