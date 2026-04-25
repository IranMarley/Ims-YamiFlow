namespace Ims.YamiFlow.Domain.Interfaces.Services;

public interface IOutboxService
{
    Task EnqueueAsync(string type, object payload, CancellationToken ct = default);
}
