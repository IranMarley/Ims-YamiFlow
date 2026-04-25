using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Subscription?> GetByStripeSubscriptionIdAsync(string stripeSubscriptionId, CancellationToken ct = default);
    Task<Subscription?> GetActiveByUserAsync(string userId, CancellationToken ct = default);
    Task<Subscription?> GetLatestByUserAsync(string userId, CancellationToken ct = default);
    Task AddAsync(Subscription subscription, CancellationToken ct = default);
    void Update(Subscription subscription);
}
