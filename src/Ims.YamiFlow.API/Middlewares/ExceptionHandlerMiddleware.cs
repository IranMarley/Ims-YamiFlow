using System.Diagnostics;
using System.Net;
using System.Text.Json;
using FluentValidation;
using Ims.YamiFlow.Domain.Exceptions;
using Serilog.Context;

namespace Ims.YamiFlow.API.Middlewares;

public class ExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlerMiddleware> _logger;

    public ExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlerMiddleware> logger)
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
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext ctx, Exception ex)
    {
        var exceptionType = ex.GetType().Name;
        var route = ctx.GetEndpoint()?.DisplayName ?? "unknown";
        var method = ctx.Request.Method;
        var path = ctx.Request.Path;

        // TraceId is crucial for correlating client reports with Loki logs
        var traceId = Activity.Current?.TraceId.ToString() ?? ctx.TraceIdentifier;

        // Push properties to Serilog for structured logging in Loki
        using (LogContext.PushProperty("exception_type", exceptionType))
        using (LogContext.PushProperty("http_route", route))
        using (LogContext.PushProperty("http_method", method))
        using (LogContext.PushProperty("http_path", path))
        using (LogContext.PushProperty("trace_id", traceId))
        {
            var (statusCode, clientResponse) = MapException(ex, traceId);

            // Log the full exception (including StackTrace and InnerExceptions)
            if ((int)statusCode >= 500)
            {
                _logger.LogError(ex, 
                    "Unhandled exception {ExceptionType} on {Method} {Path}. TraceId: {TraceId}", 
                    exceptionType, method, path, traceId);
            }
            else
            {
                _logger.LogWarning(
                    "Business exception {ExceptionType} on {Method} {Path}: {Message}", 
                    exceptionType, method, path, ex.Message);
            }

            EnrichActivity(Activity.Current, ex, ex.GetType().FullName ?? "Unknown");

            await WriteResponseAsync(ctx, statusCode, clientResponse);
        }
    }

    private (HttpStatusCode statusCode, object responseBody) MapException(Exception ex, string traceId)
    {
        return ex switch
        {
            ValidationException vex => (
                HttpStatusCode.BadRequest,
                new
                {
                    type = "ValidationError",
                    message = "One or more validation errors occurred.",
                    errors = vex.Errors
                        .GroupBy(e => e.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()),
                    traceId
                }),

            DomainException dex => (
                HttpStatusCode.UnprocessableEntity,
                new
                {
                    type = "DomainError",
                    message = dex.Message,
                    traceId
                }),

            _ => (
                HttpStatusCode.InternalServerError,
                new
                {
                    type = "InternalError",
                    message = "An unexpected error occurred. Please provide the trace ID to support.",
                    traceId
                })
        };
    }

    private static void EnrichActivity(Activity? activity, Exception ex, string exceptionFullType)
    {
        if (activity == null) return;

        activity.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity.SetTag("exception.type", exceptionFullType);
        activity.SetTag("exception.message", ex.Message);
        activity.SetTag("exception.stacktrace", ex.StackTrace);
    }

    private static async Task WriteResponseAsync(HttpContext ctx, HttpStatusCode statusCode, object details)
    {
        ctx.Response.StatusCode = (int)statusCode;
        ctx.Response.ContentType = "application/json";

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(details, options));
    }
}