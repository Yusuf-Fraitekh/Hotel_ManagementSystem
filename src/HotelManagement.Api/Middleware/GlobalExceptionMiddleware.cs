using System.Text.Json;
using FluentValidation;
using HotelManagement.Api.DTOs.Shared;
using HotelManagement.Application.Common;

namespace HotelManagement.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public GlobalExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await WriteError(context, StatusCodes.Status400BadRequest, string.Join(" | ", ex.Errors.Select(x => x.ErrorMessage)));
        }
        catch (AppException ex)
        {
            await WriteError(context, ex.StatusCode, ex.Message);
        }
        catch
        {
            await WriteError(context, StatusCodes.Status500InternalServerError, "Unexpected server error.");
        }
    }

    private static async Task WriteError(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        var payload = JsonSerializer.Serialize(new ApiErrorDto(message, statusCode));
        await context.Response.WriteAsync(payload);
    }
}
