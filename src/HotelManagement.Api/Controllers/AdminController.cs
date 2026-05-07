using HotelManagement.Api.Common;
using HotelManagement.Api.DTOs.Admin;
using HotelManagement.Api.DTOs.Bookings;
using HotelManagement.Api.DTOs.Rooms;
using HotelManagement.Api.DTOs.Shared;
using HotelManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HotelManagement.Infrastructure.Data;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Authorize(Policy = "RequireAdmin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IUserService _userService;
    private readonly IDashboardService _dashboardService;
    private readonly IHotelInfoService _hotelInfoService;
    private readonly IRoomService _roomService;
    private readonly AppDbContext _dbContext;

    public AdminController(
        IBookingService bookingService,
        IUserService userService,
        IDashboardService dashboardService,
        IHotelInfoService hotelInfoService,
        IRoomService roomService,
        AppDbContext dbContext)
    {
        _bookingService = bookingService;
        _userService = userService;
        _dashboardService = dashboardService;
        _hotelInfoService = hotelInfoService;
        _roomService = roomService;
        _dbContext = dbContext;
    }

    [HttpGet("rooms")]
    public async Task<ActionResult<PagedResponseDto<RoomResponseDto>>> GetRooms([FromQuery] int page = 1, [FromQuery] int pageSize = 500, CancellationToken cancellationToken = default)
    {
        var result = await _roomService.GetRoomsAsync(
            checkIn: null,
            checkOut: null,
            guests: null,
            type: null,
            bed: null,
            view: null,
            floor: null,
            stayType: null,
            tag: null,
            priceMin: null,
            priceMax: null,
            sort: "recommended",
            page: page,
            pageSize: pageSize,
            cancellationToken: cancellationToken);

        return Ok(new PagedResponseDto<RoomResponseDto>
        {
            Items = result.Items.Select(x => x.ToRoomDto()).ToList(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        });
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<PagedResponseDto<BookingResponseDto>>> GetBookings([FromQuery] BookingListQueryDto query, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetAllBookingsAsync(query.Search, query.Sort, query.Page, query.PageSize, cancellationToken);
        return Ok(new PagedResponseDto<BookingResponseDto>
        {
            Items = result.Items.Select(x => x.ToBookingDto()).ToList(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        });
    }

    [HttpDelete("bookings/{id:int}")]
    public async Task<IActionResult> DeleteBooking(int id, CancellationToken cancellationToken)
    {
        await _bookingService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("guests")]
    public async Task<ActionResult<IReadOnlyList<GuestListItemDto>>> GetGuests([FromQuery] string? search, CancellationToken cancellationToken)
    {
        var guests = await _userService.GetGuestsAsync(search, cancellationToken);
        return Ok(guests.Select(x => x.ToGuestDto()).ToList());
    }

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboardSummary(CancellationToken cancellationToken)
    {
        var summary = await _dashboardService.GetSummaryAsync(cancellationToken);
        return Ok(new DashboardSummaryDto
        {
            TotalRevenue = summary.totalRevenue,
            TotalBookings = summary.totalBookings,
            ActiveRooms = summary.activeRooms,
            TotalGuests = summary.totalGuests
        });
    }

    [HttpGet("dashboard/details")]
    public async Task<ActionResult<DashboardDetailsDto>> GetDashboardDetails(CancellationToken cancellationToken)
    {
        var summary = await _dashboardService.GetSummaryAsync(cancellationToken);
        var recent = await _bookingService.GetAllBookingsAsync(null, null, 1, 10, cancellationToken);
        return Ok(new DashboardDetailsDto
        {
            Summary = new DashboardSummaryDto
            {
                TotalRevenue = summary.totalRevenue,
                TotalBookings = summary.totalBookings,
                ActiveRooms = summary.activeRooms,
                TotalGuests = summary.totalGuests
            },
            RecentBookings = recent.Items.Select(x => x.ToBookingDto()).ToList()
        });
    }

    [HttpGet("settings/hotel-info")]
    public async Task<ActionResult<HotelInfoDto>> GetHotelInfo(CancellationToken cancellationToken)
    {
        var info = await _hotelInfoService.GetAsync(cancellationToken);
        return Ok(new HotelInfoDto { Name = info.Name, City = info.City, Country = info.Country, Email = info.Email });
    }

    [HttpPut("settings/hotel-info")]
    public async Task<ActionResult<HotelInfoDto>> UpdateHotelInfo(HotelInfoDto request, CancellationToken cancellationToken)
    {
        var info = await _hotelInfoService.UpdateAsync(request.Name, request.City, request.Country, request.Email, cancellationToken);
        return Ok(new HotelInfoDto { Name = info.Name, City = info.City, Country = info.Country, Email = info.Email });
    }

    [HttpGet("settings/stats")]
    public async Task<IActionResult> GetSettingsStats(CancellationToken cancellationToken)
    {
        var rooms = await _dbContext.Rooms.CountAsync(x => x.IsActive, cancellationToken);
        var bookings = await _dbContext.Bookings.CountAsync(cancellationToken);
        var users = await _dbContext.Users.CountAsync(cancellationToken);
        return Ok(new { rooms, bookings, users });
    }

    [HttpDelete("settings/bookings")]
    public async Task<IActionResult> ClearBookings(CancellationToken cancellationToken)
    {
        _dbContext.Bookings.RemoveRange(_dbContext.Bookings);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("settings/reset-rooms")]
    public async Task<IActionResult> ResetRooms(CancellationToken cancellationToken)
    {
        _dbContext.RoomImages.RemoveRange(_dbContext.RoomImages);
        _dbContext.RoomRoomTags.RemoveRange(_dbContext.RoomRoomTags);
        _dbContext.Rooms.RemoveRange(_dbContext.Rooms);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await DbSeeder.SeedDefaultRoomsAsync(_dbContext);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Rooms reset successfully." });
    }

    [HttpDelete("settings/all-data")]
    public async Task<IActionResult> ClearAllData(CancellationToken cancellationToken)
    {
        _dbContext.Bookings.RemoveRange(_dbContext.Bookings);
        _dbContext.RoomImages.RemoveRange(_dbContext.RoomImages);
        _dbContext.RoomRoomTags.RemoveRange(_dbContext.RoomRoomTags);
        _dbContext.Rooms.RemoveRange(_dbContext.Rooms);
        _dbContext.RoomTags.RemoveRange(_dbContext.RoomTags);
        _dbContext.HotelInfos.RemoveRange(_dbContext.HotelInfos);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
