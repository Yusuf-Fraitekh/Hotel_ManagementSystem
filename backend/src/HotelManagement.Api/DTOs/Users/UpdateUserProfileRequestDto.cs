namespace HotelManagement.Api.DTOs.Users;

public class UpdateUserProfileRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
}
