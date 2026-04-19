using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces;

public interface IAuthEventService
{
    Task LogAsync(AuthEvent authEvent, CancellationToken ct = default);
}
