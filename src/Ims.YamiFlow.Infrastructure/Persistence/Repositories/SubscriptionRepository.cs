using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class SubscriptionRepository(AppDbContext db) : ISubscriptionRepository
{
    public Task<Subscription?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Subscriptions.FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<Subscription?> GetByStripeSubscriptionIdAsync(string stripeSubscriptionId, CancellationToken ct = default)
        => db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId, ct);

    public Task<Subscription?> GetActiveByUserAsync(string userId, CancellationToken ct = default)
        => db.Subscriptions
            .Where(s => s.UserId == userId &&
                        (s.Status == Domain.Enums.SubscriptionStatus.Active ||
                         s.Status == Domain.Enums.SubscriptionStatus.Trialing ||
                         s.Status == Domain.Enums.SubscriptionStatus.PastDue))
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public Task<Subscription?> GetLatestByUserAsync(string userId, CancellationToken ct = default)
        => db.Subscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(Subscription subscription, CancellationToken ct = default)
        => await db.Subscriptions.AddAsync(subscription, ct);

    public void Update(Subscription subscription) => db.Subscriptions.Update(subscription);
}
