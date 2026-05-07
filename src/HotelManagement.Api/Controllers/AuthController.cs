using HotelManagement.Api.Common;
using HotelManagement.Api.DTOs.Auth;
using HotelManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request.FullName, request.Email, request.Password, request.Phone, cancellationToken);
        return Ok(new AuthResponseDto
        {
            AccessToken = result.token,
            ExpiresAt = result.expiresAt,
            User = result.user.ToProfileDto()
        });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request.Email, request.Password, cancellationToken);
        return Ok(new AuthResponseDto
        {
            AccessToken = result.token,
            ExpiresAt = result.expiresAt,
            User = result.user.ToProfileDto()
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout() => Ok(new { message = "Logged out. Client should discard token." });
}
