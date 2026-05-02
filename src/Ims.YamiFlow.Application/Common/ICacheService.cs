namespace Ims.YamiFlow.Application.Common;

public interface ICacheService
{
    /// <summary>
    /// Cache-Aside with per-key stampede protection.
    /// Factory result (including null) is stored so callers can cache negative results.
    /// </summary>
    Task<T?> GetOrSetAsync<T>(
        string key,
        Func<CancellationToken, Task<T?>> factory,
        TimeSpan ttl,
        CancellationToken ct = default);

    Task RemoveAsync(string key, CancellationToken ct = default);

    /// <summary>
    /// Removes all keys whose name starts with <paramref name="prefix"/>.
    /// No-op when Redis is not configured (dev/in-memory mode).
    /// </summary>
    Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
}
