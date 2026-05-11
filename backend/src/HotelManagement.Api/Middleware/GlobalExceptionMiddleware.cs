using System.Text.Json;
using FluentValidation;
using HotelManagement.Api.DTOs.Shared;
using HotelManagement.Application.Common;

namespace HotelManagement.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error on {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteError(context, StatusCodes.Status400BadRequest, string.Join(" | ", ex.Errors.Select(x => x.ErrorMessage)));
        }
        catch (AppException ex)
        {
            _logger.LogWarning(ex, "Application error on {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteError(context, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error on {Method} {Path}", context.Request.Method, context.Request.Path);
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
