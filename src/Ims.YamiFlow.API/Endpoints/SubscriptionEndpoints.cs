using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Subscriptions;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Subscriptions;

using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.API.Endpoints;

public static class SubscriptionEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/subscriptions").WithTags(Resources.Subscription);

        group.MapGet("/plans", async (ListPlansHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new ListPlansQuery(), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("ListPlans");

        group.MapGet("/current", async (GetCurrentSubscriptionHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new GetCurrentSubscriptionQuery(userId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("GetCurrentSubscription");

        group.MapPost("/subscribe", async (
            SubscribeRequest req,
            SubscribeHandler handler,
            IStripeService stripe,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var simulate = string.IsNullOrEmpty(stripe.PublishableKey);
            var result = await handler.Handle(new SubscribeCommand(userId, req.PlanId, simulate), ct);
            if (!result.IsSuccess) return Results.BadRequest(result.Error);

            // Simulated path: no payment step, return as-is
            if (simulate) return Results.Ok(result.Value);

            // Real Stripe path: attach publishable key for Elements init
            var body = result.Value! with { PublishableKey = stripe.PublishableKey };
            return Results.Ok(body);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Create))
        .WithName("Subscribe");

        group.MapPost("/cancel", async (
            CancelRequest? req,
            CancelSubscriptionHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var atPeriodEnd = req?.AtPeriodEnd ?? true;
            var result = await handler.Handle(new CancelSubscriptionCommand(userId, atPeriodEnd), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Update))
        .WithName("CancelSubscription");

        group.MapPost("/resume", async (ResumeSubscriptionHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new ResumeSubscriptionCommand(userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Update))
        .WithName("ResumeSubscription");
    }
}

public record SubscribeRequest(Guid PlanId);
public record CancelRequest(bool AtPeriodEnd = true);
