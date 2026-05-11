namespace HotelManagement.Domain.Entities;

public class RoomImage : BaseEntity
{
    public int RoomId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public Room Room { get; set; } = null!;
}
