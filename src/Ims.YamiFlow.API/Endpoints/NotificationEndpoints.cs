using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Notifications;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Notifications;
using MediatR;
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
            IMediator mediator,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Results.Ok(await mediator.Send(new ListNotificationsQuery(userId, page, pageSize), ct));
        })
        .RequireAuthorization()
        .WithName("ListNotifications");

        group.MapPost("/{notificationId:guid}/read", async (
            Guid notificationId,
            IMediator mediator,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new MarkNotificationReadCommand(notificationId, userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("MarkNotificationRead");

        group.MapPost("/read-all", async (
            IMediator mediator,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new MarkAllNotificationsReadCommand(userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("MarkAllNotificationsRead");
    }
}
