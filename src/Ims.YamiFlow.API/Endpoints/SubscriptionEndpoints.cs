using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Subscriptions;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Subscriptions;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.API.Endpoints;

public static class SubscriptionEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/subscriptions").WithTags(Resources.Subscription);

        group.MapGet("/plans", async (IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new ListPlansQuery(), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("ListPlans");

        group.MapGet("/current", async (IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new GetCurrentSubscriptionQuery(userId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("GetCurrentSubscription");

        group.MapPost("/subscribe", async (
            SubscribeRequest req,
            IMediator mediator,
            IStripeService stripe,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new SubscribeCommand(userId, req.PlanId), ct);
            if (!result.IsSuccess) return Results.BadRequest(result.Error);

            // Frontend needs clientSecret (Elements) and publishableKey (init).
            var body = result.Value! with { PublishableKey = stripe.PublishableKey };
            return Results.Ok(body);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Create))
        .WithName("Subscribe");

        group.MapPost("/cancel", async (
            CancelRequest? req,
            IMediator mediator,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var atPeriodEnd = req?.AtPeriodEnd ?? true;
            var result = await mediator.Send(new CancelSubscriptionCommand(userId, atPeriodEnd), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Update))
        .WithName("CancelSubscription");

        group.MapPost("/resume", async (IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new ResumeSubscriptionCommand(userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Update))
        .WithName("ResumeSubscription");
    }
}

public record SubscribeRequest(Guid PlanId);
public record CancelRequest(bool AtPeriodEnd = true);
