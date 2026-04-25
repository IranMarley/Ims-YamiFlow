using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class SubscriptionPlanRepository(AppDbContext db) : ISubscriptionPlanRepository
{
    public Task<SubscriptionPlan?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == id, ct);

    public Task<SubscriptionPlan?> GetByStripePriceIdAsync(string stripePriceId, CancellationToken ct = default)
        => db.SubscriptionPlans.FirstOrDefaultAsync(p => p.StripePriceId == stripePriceId, ct);

    public async Task<IReadOnlyList<SubscriptionPlan>> ListActiveAsync(CancellationToken ct = default)
        => await db.SubscriptionPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Amount)
            .ToListAsync(ct);

    public async Task AddAsync(SubscriptionPlan plan, CancellationToken ct = default)
        => await db.SubscriptionPlans.AddAsync(plan, ct);

    public void Update(SubscriptionPlan plan) => db.SubscriptionPlans.Update(plan);
}
