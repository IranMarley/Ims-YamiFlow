using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface ISubscriptionPlanRepository
{
    Task<SubscriptionPlan?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<SubscriptionPlan?> GetByStripePriceIdAsync(string stripePriceId, CancellationToken ct = default);
    Task<IReadOnlyList<SubscriptionPlan>> ListActiveAsync(CancellationToken ct = default);
    Task AddAsync(SubscriptionPlan plan, CancellationToken ct = default);
    void Update(SubscriptionPlan plan);
}
