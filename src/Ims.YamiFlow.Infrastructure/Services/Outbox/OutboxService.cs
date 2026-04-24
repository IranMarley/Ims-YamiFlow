using System.Text.Json;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces;
using Ims.YamiFlow.Infrastructure.Persistence.Context;

namespace Ims.YamiFlow.Infrastructure.Services.Outbox;

public class OutboxService(AppDbContext db) : IOutboxService
{
    public async Task EnqueueAsync(string type, object payload, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(payload);
        var message = OutboxMessage.Create(type, json);
        await db.OutboxMessages.AddAsync(message, ct);
        await db.SaveChangesAsync(ct);
    }
}
