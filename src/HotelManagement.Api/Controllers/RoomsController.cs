using HotelManagement.Api.Common;
using HotelManagement.Api.DTOs.Rooms;
using HotelManagement.Api.DTOs.Shared;
using HotelManagement.Application.Interfaces;
using HotelManagement.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HotelManagement.Infrastructure.Data;
using System.Text.RegularExpressions;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly AppDbContext _dbContext;
    private readonly IWebHostEnvironment _environment;

    public RoomsController(IRoomService roomService, AppDbContext dbContext, IWebHostEnvironment environment)
    {
        _roomService = roomService;
        _dbContext = dbContext;
        _environment = environment;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResponseDto<RoomResponseDto>>> GetRooms([FromQuery] RoomListQueryDto query, CancellationToken cancellationToken)
    {
        var result = await _roomService.GetRoomsAsync(query.CheckIn, query.CheckOut, query.Guests, query.Type, query.Bed, query.View,
            query.Floor, query.StayType, query.Tag, query.PriceMin, query.PriceMax, query.Sort, query.Page, query.PageSize, cancellationToken);
        return Ok(new PagedResponseDto<RoomResponseDto>
        {
            Items = result.Items.Select(x => x.ToRoomDto()).ToList(),
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        });
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<RoomResponseDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var room = await _roomService.GetByIdAsync(id, cancellationToken);
        return Ok(room.ToRoomDto());
    }

    [HttpPost]
    [Authorize(Policy = "RequireStaffOrAdmin")]
    public async Task<ActionResult<RoomResponseDto>> Create(RoomWriteDto request, CancellationToken cancellationToken)
    {
        var room = await BuildRoomEntity(request, cancellationToken);
        var created = await _roomService.CreateAsync(room, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created.ToRoomDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "RequireStaffOrAdmin")]
    public async Task<ActionResult<RoomResponseDto>> Update(int id, RoomWriteDto request, CancellationToken cancellationToken)
    {
        var room = await BuildRoomEntity(request, cancellationToken);
        room.Id = id;
        var updated = await _roomService.UpdateAsync(room, cancellationToken);
        return Ok(updated.ToRoomDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _roomService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    private async Task<Room> BuildRoomEntity(RoomWriteDto request, CancellationToken cancellationToken)
    {
        var tags = await _dbContext.RoomTags.Where(x => request.Tags.Contains(x.Name)).ToListAsync(cancellationToken);
        foreach (var newTag in request.Tags.Where(t => tags.All(x => x.Name != t)))
        {
            var tagEntity = new HotelManagement.Domain.Entities.RoomTag { Name = newTag };
            tags.Add(tagEntity);
        }

        var normalizedImages = await NormalizeImagesAsync(request.Images, cancellationToken);
        if (normalizedImages.Count == 0)
        {
            normalizedImages.Add("/uploads/room-placeholder.svg");
        }

        return new Room
        {
            Name = request.Name,
            Type = request.Type,
            BedType = request.BedType,
            ViewType = request.ViewType,
            Floor = request.Floor,
            MaxGuests = request.MaxGuests,
            PricePerNight = request.PricePerNight,
            StayType = request.StayType,
            Description = request.Description,
            Images = normalizedImages.Select((x, idx) => new RoomImage { ImageUrl = x, SortOrder = idx }).ToList(),
            RoomTags = tags.Select(x => new HotelManagement.Domain.Entities.RoomRoomTag { RoomTag = x }).ToList()
        };
    }

    private async Task<List<string>> NormalizeImagesAsync(IEnumerable<string> images, CancellationToken cancellationToken)
    {
        var result = new List<string>();
        foreach (var image in images.Where(x => !string.IsNullOrWhiteSpace(x)))
        {
            if (!image.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                result.Add(image);
                continue;
            }

            var saved = await SaveDataUrlImageAsync(image, cancellationToken);
            if (!string.IsNullOrWhiteSpace(saved))
            {
                result.Add(saved);
            }
        }

        return result;
    }

    private async Task<string?> SaveDataUrlImageAsync(string dataUrl, CancellationToken cancellationToken)
    {
        var match = Regex.Match(dataUrl, @"^data:image/(?<ext>png|jpg|jpeg|webp|gif);base64,(?<data>.+)$", RegexOptions.IgnoreCase);
        if (!match.Success)
        {
            return null;
        }

        var ext = match.Groups["ext"].Value.ToLowerInvariant() switch
        {
            "jpeg" => "jpg",
            _ => match.Groups["ext"].Value.ToLowerInvariant()
        };

        var bytes = Convert.FromBase64String(match.Groups["data"].Value);
        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var uploadDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadDir);
        var fileName = $"{Guid.NewGuid():N}.{ext}";
        var filePath = Path.Combine(uploadDir, fileName);
        await System.IO.File.WriteAllBytesAsync(filePath, bytes, cancellationToken);
        return $"/uploads/{fileName}";
    }
}
