using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Application.Commands.Subscriptions;

public record SyncSubscriptionCommand(string UserId);

public record SyncSubscriptionResponse(string Status, bool GrantsAccess);

/// <summary>
/// Fetches the user's latest subscription status directly from Stripe, persists it locally,
/// and evicts the subscription cache. Called by the frontend after payment confirmation
/// so access is granted immediately without waiting for the webhook or cache TTL.
/// </summary>
public class SyncSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    IStripeService stripe,
    ICacheService cache,
    IUnitOfWork uow,
    ILogger<SyncSubscriptionHandler> logger)
    : IHandler<SyncSubscriptionCommand, Result<SyncSubscriptionResponse>>
{
    public async Task<Result<SyncSubscriptionResponse>> Handle(SyncSubscriptionCommand cmd, CancellationToken ct)
    {
        var sub = await subscriptions.GetLatestByUserAsync(cmd.UserId, ct);
        if (sub is null)
            return Result.Failure<SyncSubscriptionResponse>("No subscription found.");

        // Simulated subscription — no Stripe call needed, but still bust the cache.
        if (sub.StripeSubscriptionId.StartsWith("sim_"))
        {
            await cache.RemoveAsync(CacheKeys.UserSubscription(cmd.UserId), ct);
            return Result.Success(new SyncSubscriptionResponse(sub.Status.ToString(), sub.GrantsAccess()));
        }

        try
        {
            var stripeResult = await stripe.GetSubscriptionAsync(sub.StripeSubscriptionId, ct);
            var status = SubscribeHandler.MapStatus(stripeResult.Status);

            sub.SyncFromStripe(
                status,
                stripeResult.CurrentPeriodStart,
                stripeResult.CurrentPeriodEnd,
                stripeResult.CancelAtPeriodEnd,
                stripeResult.CanceledAt,
                stripeResult.TrialEnd);

            subscriptions.Update(sub);
            await uow.CommitAsync(ct);

            // Evict cache so next GET /api/subscriptions/current returns fresh Active status.
            await cache.RemoveAsync(CacheKeys.UserSubscription(cmd.UserId), ct);

            logger.LogInformation("Synced subscription {SubId} → {Status} for user {UserId}",
                sub.StripeSubscriptionId, status, cmd.UserId);

            return Result.Success(new SyncSubscriptionResponse(status.ToString(), sub.GrantsAccess()));
        }
        catch (Domain.Exceptions.PaymentException ex)
        {
            logger.LogWarning(ex, "Could not sync subscription {SubId} from Stripe.", sub.StripeSubscriptionId);
            return Result.Failure<SyncSubscriptionResponse>("Could not verify subscription status with payment provider.");
        }
    }
}
