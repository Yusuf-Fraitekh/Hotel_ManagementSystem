namespace HotelManagement.Api.DTOs.Rooms;

public class RoomListQueryDto
{
    public DateOnly? CheckIn { get; set; }
    public DateOnly? CheckOut { get; set; }
    public int? Guests { get; set; }
    public string? Type { get; set; }
    public string? Bed { get; set; }
    public string? View { get; set; }
    public int? Floor { get; set; }
    public string? StayType { get; set; }
    public string? Tag { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class RoomWriteDto
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
    public List<string> Tags { get; set; } = [];
    public List<string> Images { get; set; } = [];
}

public class RoomResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string BedType { get; set; } = string.Empty;
    public string ViewType { get; set; } = string.Empty;
    public int Floor { get; set; }
    public int MaxGuests { get; set; }
    public decimal PricePerNight { get; set; }
    public string StayType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string> Tags { get; set; } = [];
    public List<string> Images { get; set; } = [];
}
