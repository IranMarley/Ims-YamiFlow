using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Notifications;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Notifications;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class NotificationEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications").WithTags(Resources.Notification);

        group.MapGet("/", async (
            int page,
            int pageSize,
            ListNotificationsHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Results.Ok(await handler.Handle(new ListNotificationsQuery(userId, page, pageSize), ct));
        })
        .RequireAuthorization()
        .WithName("ListNotifications");

        group.MapPost("/{notificationId:guid}/read", async (
            Guid notificationId,
            MarkNotificationReadHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new MarkNotificationReadCommand(notificationId, userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("MarkNotificationRead");

        group.MapPost("/read-all", async (
            MarkAllNotificationsReadHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new MarkAllNotificationsReadCommand(userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("MarkAllNotificationsRead");
    }
}
