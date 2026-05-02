
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Queries.Subscriptions;

public record SubscriptionDetail(
    Guid SubscriptionId,
    Guid PlanId,
    string PlanName,
    decimal Amount,
    string Currency,
    string Interval,
    string Status,
    DateTime? CurrentPeriodStart,
    DateTime? CurrentPeriodEnd,
    bool CancelAtPeriodEnd,
    DateTime? TrialEnd,
    bool GrantsAccess);

public record GetCurrentSubscriptionQuery(string UserId);

public class GetCurrentSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    ISubscriptionPlanRepository plans,
    ICacheService cache)
    : IHandler<GetCurrentSubscriptionQuery, Result<SubscriptionDetail?>>
{
    public async Task<Result<SubscriptionDetail?>> Handle(
        GetCurrentSubscriptionQuery q, CancellationToken ct)
    {
        // null is a valid cached value — user has no subscription
        var detail = await cache.GetOrSetAsync<SubscriptionDetail>(
            CacheKeys.UserSubscription(q.UserId),
            async ct =>
            {
                var sub = await subscriptions.GetLatestByUserAsync(q.UserId, ct);
                if (sub is null) return null;

                var plan = await plans.GetByIdAsync(sub.PlanId, ct);

                return new SubscriptionDetail(
                    sub.Id,
                    sub.PlanId,
                    plan?.Name ?? "Unknown",
                    plan?.Amount ?? 0,
                    plan?.Currency ?? "usd",
                    plan?.Interval.ToString() ?? string.Empty,
                    sub.Status.ToString(),
                    sub.CurrentPeriodStart,
                    sub.CurrentPeriodEnd,
                    sub.CancelAtPeriodEnd,
                    sub.TrialEnd,
                    sub.GrantsAccess());
            },
            TimeSpan.FromMinutes(2),
            ct);

        return Result.Success<SubscriptionDetail?>(detail);
    }
}
