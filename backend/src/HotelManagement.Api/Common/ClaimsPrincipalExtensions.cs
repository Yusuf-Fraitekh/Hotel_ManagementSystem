using System.Security.Claims;
using HotelManagement.Application.Common;

namespace HotelManagement.Api.Common;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (!int.TryParse(value, out var userId))
        {
            throw new AppException("Invalid token user id.", 401);
        }

        return userId;
    }
}
