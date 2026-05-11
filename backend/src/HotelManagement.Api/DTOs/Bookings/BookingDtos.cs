namespace HotelManagement.Api.DTOs.Bookings;

public class CreateBookingRequestDto
{
    public int RoomId { get; set; }
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int GuestsCount { get; set; }
    public string StayType { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class ExtendBookingRequestDto
{
    public DateOnly NewCheckOutDate { get; set; }
}

public class BookingListQueryDto
{
    public string? Sort { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class BookingResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int GuestsCount { get; set; }
    public string StayType { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
