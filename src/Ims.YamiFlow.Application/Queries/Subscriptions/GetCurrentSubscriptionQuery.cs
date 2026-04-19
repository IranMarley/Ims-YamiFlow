using MediatR;

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

public record GetCurrentSubscriptionQuery(string UserId) : IRequest<Result<SubscriptionDetail?>>;

public class GetCurrentSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    ISubscriptionPlanRepository plans)
    : IRequestHandler<GetCurrentSubscriptionQuery, Result<SubscriptionDetail?>>
{
    public async Task<Result<SubscriptionDetail?>> Handle(
        GetCurrentSubscriptionQuery q, CancellationToken ct)
    {
        var sub = await subscriptions.GetLatestByUserAsync(q.UserId, ct);
        if (sub is null) return Result.Success<SubscriptionDetail?>(null);

        var plan = await plans.GetByIdAsync(sub.PlanId, ct);

        var detail = new SubscriptionDetail(
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
        return Result.Success<SubscriptionDetail?>(detail);
    }
}
