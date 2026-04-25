
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

public class ListPlansHandler(ISubscriptionPlanRepository plans)
    : IHandler<ListPlansQuery, Result<IReadOnlyList<PlanItem>>>
{
    public async Task<Result<IReadOnlyList<PlanItem>>> Handle(
        ListPlansQuery q, CancellationToken ct)
    {
        var items = await plans.ListActiveAsync(ct);
        IReadOnlyList<PlanItem> mapped = items
            .Select(p => new PlanItem(
                p.Id, p.Name, p.Description, p.Amount, p.Currency,
                p.Interval.ToString(), p.IntervalCount, p.TrialDays, p.StripePriceId))
            .ToList();
        return Result.Success(mapped);
    }
}
