using System.Security.Claims;
using HotelManagement.Api.Common;
using HotelManagement.Api.DTOs.Bookings;
using HotelManagement.Api.DTOs.Shared;
using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HotelManagement.Infrastructure.Data;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly AppDbContext _dbContext;

    public BookingsController(IBookingService bookingService, AppDbContext dbContext)
    {
        _bookingService = bookingService;
        _dbContext = dbContext;
    }

    [HttpGet("me")]
    public async Task<ActionResult<PagedResponseDto<BookingResponseDto>>> GetMine([FromQuery] BookingListQueryDto query, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetUserBookingsAsync(User.GetUserId(), query.Sort, query.Page, query.PageSize, cancellationToken);
        return Ok(new PagedResponseDto<BookingResponseDto>
        {
            Items = result.Items.Select(x => x.ToBookingDto()).ToList(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        });
    }

    [HttpPost]
    public async Task<ActionResult<BookingResponseDto>> Create(CreateBookingRequestDto request, CancellationToken cancellationToken)
    {
        var booking = new Booking
        {
            UserId = User.GetUserId(),
            RoomId = request.RoomId,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            GuestsCount = request.GuestsCount,
            StayType = request.StayType,
            Notes = request.Notes
        };
        var created = await _bookingService.CreateAsync(booking, cancellationToken);
        created = await _dbContext.Bookings.Include(x => x.User).Include(x => x.Room).FirstAsync(x => x.Id == created.Id, cancellationToken);
        return CreatedAtAction(nameof(GetMine), new { }, created.ToBookingDto());
    }

    [HttpPatch("{id:int}/extend")]
    public async Task<ActionResult<BookingResponseDto>> Extend(int id, ExtendBookingRequestDto request, CancellationToken cancellationToken)
    {
        var booking = await _bookingService.ExtendAsync(id, User.GetUserId(), request.NewCheckOutDate, cancellationToken);
        booking = await _dbContext.Bookings.Include(x => x.User).Include(x => x.Room).FirstAsync(x => x.Id == booking.Id, cancellationToken);
        return Ok(booking.ToBookingDto());
    }

    [HttpPatch("{id:int}/cancel")]
    public async Task<ActionResult<BookingResponseDto>> Cancel(int id, CancellationToken cancellationToken)
    {
        var isAdmin = User.IsInRole("Admin");
        var booking = await _bookingService.CancelAsync(id, User.GetUserId(), isAdmin, cancellationToken);
        booking = await _dbContext.Bookings.Include(x => x.User).Include(x => x.Room).FirstAsync(x => x.Id == booking.Id, cancellationToken);
        return Ok(booking.ToBookingDto());
    }
}
