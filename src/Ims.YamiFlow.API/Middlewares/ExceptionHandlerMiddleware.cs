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
        var exceptionFullType = ex.GetType().FullName;

        var route = ctx.GetEndpoint()?.DisplayName ?? "unknown";
        var method = ctx.Request.Method;
        var path = ctx.Request.Path;

        var traceId = Activity.Current?.TraceId.ToString() ?? ctx.TraceIdentifier;

        using (LogContext.PushProperty("exception_type", exceptionType))
        using (LogContext.PushProperty("http_route", route))
        using (LogContext.PushProperty("http_method", method))
        using (LogContext.PushProperty("http_path", path))
        using (LogContext.PushProperty("trace_id", traceId))
        {
            switch (ex)
            {
                case ValidationException validationEx:
                    _logger.LogWarning(ex,
                        "Validation error on {Method} {Path}: {Message}",
                        method, path, ex.Message);

                    await WriteResponseAsync(ctx,
                        HttpStatusCode.BadRequest,
                        "ValidationError",
                        new
                        {
                            errors = validationEx.Errors
                                .GroupBy(e => e.PropertyName)
                                .ToDictionary(
                                    g => g.Key,
                                    g => g.Select(e => e.ErrorMessage).ToArray()),
                            traceId
                        });
                    return;

                case DomainException domainEx:
                    _logger.LogWarning(ex,
                        "Domain error on {Method} {Path}: {Message}",
                        method, path, domainEx.Message);

                    await WriteResponseAsync(ctx,
                        HttpStatusCode.UnprocessableEntity,
                        "DomainError",
                        new
                        {
                            message = domainEx.Message,
                            traceId
                        });
                    return;

                default:
                    _logger.LogError(ex,
                        "Unhandled exception {ExceptionType} on {Method} {Path}",
                        exceptionType, method, path);

                    EnrichActivity(Activity.Current, ex, exceptionFullType);

                    await WriteResponseAsync(ctx,
                        HttpStatusCode.InternalServerError,
                        "InternalError",
                        new
                        {
                            message = "An unexpected error occurred.",
                            traceId
                        });
                    return;
            }
        }
    }

    private static void EnrichActivity(Activity? activity, Exception ex, string exceptionFullType)
    {
        if (activity == null) return;

        activity.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity.SetTag("exception.type", exceptionFullType);
        activity.SetTag("exception.message", ex.Message);
        activity.SetTag("exception.stacktrace", ex.StackTrace);
    }

    private static async Task WriteResponseAsync(
        HttpContext ctx,
        HttpStatusCode statusCode,
        string type,
        object details)
    {
        ctx.Response.StatusCode = (int)statusCode;
        ctx.Response.ContentType = "application/json";

        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            type = "InternalError",
            message = "An unexpected error occurred. Please try again later."
        }));
    }
}