namespace HotelManagement.Api.DTOs.Admin;

public class DashboardSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalBookings { get; set; }
    public int ActiveRooms { get; set; }
    public int TotalGuests { get; set; }
}

public class DashboardDetailsDto
{
    public DashboardSummaryDto Summary { get; set; } = new();
    public List<HotelManagement.Api.DTOs.Bookings.BookingResponseDto> RecentBookings { get; set; } = [];
}

public class GuestListItemDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
}

public class HotelInfoDto
{
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
