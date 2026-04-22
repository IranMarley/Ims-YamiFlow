using System.Net;
using System.Text.Json;
using FluentValidation;
using Ims.YamiFlow.Domain.Exceptions;
using OpenTelemetry.Trace;

namespace Ims.YamiFlow.API.Middlewares;

public class ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (ValidationException ex)
        {
            logger.LogWarning("Validation error: {Errors}", ex.Message);
            ctx.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            ctx.Response.ContentType = "application/json";

            var errors = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());

            await ctx.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "ValidationError",
                errors
            }));
        }
        catch (DomainException ex)
        {
            logger.LogWarning("Domain error: {Message}", ex.Message);
            ctx.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
            ctx.Response.ContentType = "application/json";

            await ctx.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "DomainError",
                message = ex.Message
            }));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            
            // Mark activity as error for OpenTelemetry
            var activity = System.Diagnostics.Activity.Current;
            activity?.SetStatus(System.Diagnostics.ActivityStatusCode.Error, ex.Message);
            activity?.AddException(ex);
            activity?.SetTag("exception_type", ex.GetType().FullName);

            ctx.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            ctx.Response.ContentType = "application/json";

            await ctx.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                type = "InternalError",
                message = "An unexpected error occurred. Please try again later."
            }));
        }
    }
}
