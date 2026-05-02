
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Queries.Subscriptions;

public record PlanItem(
    Guid Id,
    string Name,
    string Description,
    decimal Amount,
    string Currency,
    string Interval,
    int IntervalCount,
    int? TrialDays,
    string StripePriceId);

public record ListPlansQuery;

public class ListPlansHandler(ISubscriptionPlanRepository plans, ICacheService cache)
    : IHandler<ListPlansQuery, Result<IReadOnlyList<PlanItem>>>
{
    public async Task<Result<IReadOnlyList<PlanItem>>> Handle(
        ListPlansQuery q, CancellationToken ct)
    {
        var items = await cache.GetOrSetAsync<IReadOnlyList<PlanItem>>(
            CacheKeys.PlansActive,
            async ct =>
            {
                var active = await plans.ListActiveAsync(ct);
                return (IReadOnlyList<PlanItem>)active
                    .Select(p => new PlanItem(
                        p.Id, p.Name, p.Description, p.Amount, p.Currency,
                        p.Interval.ToString(), p.IntervalCount, p.TrialDays, p.StripePriceId))
                    .ToList();
            },
            TimeSpan.FromHours(1),
            ct);

        return Result.Success(items!);
    }
}
