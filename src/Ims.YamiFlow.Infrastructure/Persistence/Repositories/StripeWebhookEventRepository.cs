using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class StripeWebhookEventRepository(AppDbContext db) : IStripeWebhookEventRepository
{
    public Task<bool> ExistsAsync(string stripeEventId, CancellationToken ct = default)
        => db.StripeWebhookEvents.AnyAsync(e => e.Id == stripeEventId, ct);

    public async Task AddAsync(StripeWebhookEvent evt, CancellationToken ct = default)
        => await db.StripeWebhookEvents.AddAsync(evt, ct);

    public void Update(StripeWebhookEvent evt) => db.StripeWebhookEvents.Update(evt);
}
