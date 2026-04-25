using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IStripeWebhookEventRepository
{
    Task<bool> ExistsAsync(string stripeEventId, CancellationToken ct = default);
    Task AddAsync(StripeWebhookEvent evt, CancellationToken ct = default);
    void Update(StripeWebhookEvent evt);
}
