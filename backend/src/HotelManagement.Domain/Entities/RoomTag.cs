namespace HotelManagement.Domain.Entities;

public class RoomTag : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public ICollection<RoomRoomTag> RoomTags { get; set; } = new List<RoomRoomTag>();
}
