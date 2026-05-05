using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Application.Commands.Subscriptions;

public record SyncSubscriptionCommand(string UserId);

public record SyncSubscriptionResponse(string Status, bool GrantsAccess);

/// <summary>
/// Fetches the user's latest subscription status directly from Stripe and persists it locally.
/// Called by the frontend after payment confirmation to avoid relying on webhook timing.
/// </summary>
public class SyncSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    IStripeService stripe,
    IUnitOfWork uow,
    ILogger<SyncSubscriptionHandler> logger)
    : IHandler<SyncSubscriptionCommand, Result<SyncSubscriptionResponse>>
{
    public async Task<Result<SyncSubscriptionResponse>> Handle(SyncSubscriptionCommand cmd, CancellationToken ct)
    {
        var sub = await subscriptions.GetLatestByUserAsync(cmd.UserId, ct);
        if (sub is null)
            return Result.Failure<SyncSubscriptionResponse>("No subscription found.");

        // Simulated subscription — no Stripe call needed.
        if (sub.StripeSubscriptionId.StartsWith("sim_"))
            return Result.Success(new SyncSubscriptionResponse(sub.Status.ToString(), sub.GrantsAccess()));

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
