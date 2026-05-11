using HotelManagement.Api.Common;
using HotelManagement.Api.DTOs.Auth;
using HotelManagement.Api.DTOs.Users;
using HotelManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> Me(CancellationToken cancellationToken)
    {
        var user = await _userService.GetByIdAsync(User.GetUserId(), cancellationToken);
        return Ok(user.ToProfileDto());
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserProfileDto>> UpdateMe(UpdateUserProfileRequestDto request, CancellationToken cancellationToken)
    {
        var user = await _userService.UpdateProfileAsync(User.GetUserId(), request.FullName, request.Phone, cancellationToken);
        return Ok(user.ToProfileDto());
    }
}
