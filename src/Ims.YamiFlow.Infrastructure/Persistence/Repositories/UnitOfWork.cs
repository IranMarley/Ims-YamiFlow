using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    public async Task<int> CommitAsync(CancellationToken ct = default)
        => await db.SaveChangesAsync(ct);
}
