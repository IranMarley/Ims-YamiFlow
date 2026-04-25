namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IUnitOfWork
{
    Task<int> CommitAsync(CancellationToken ct = default);
}
