using System.Collections.Concurrent;
using System.Text.Json;
using Ims.YamiFlow.Application.Common;
using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;

namespace Ims.YamiFlow.Infrastructure.Services.Cache;

/// <summary>
/// Cache-Aside implementation backed by IDistributedCache (Redis in production,
/// in-memory when Redis is not configured).
///
/// Stampede prevention: one SemaphoreSlim per key ensures only one request
/// populates the cache on a cold start; all concurrent waiters double-check
/// after acquiring the lock and return the cached value if already populated.
///
/// Null caching: values are wrapped in an Envelope so a cached null (e.g.
/// "user has no subscription") is distinguishable from a cache miss.
///
/// Pattern eviction: when IConnectionMultiplexer is available (Redis mode),
/// RemoveByPrefixAsync uses SCAN to delete all matching keys atomically.
/// In in-memory mode the call is a no-op — the TTL will expire the entries.
/// </summary>
public sealed class RedisCacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly IConnectionMultiplexer? _multiplexer;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    // Wraps the cached value so null is distinguishable from a cache miss.
    private sealed class Envelope<T> { public T? Value { get; set; } }

    public RedisCacheService(IDistributedCache cache, IServiceProvider sp)
    {
        _cache = cache;
        _multiplexer = sp.GetService(typeof(IConnectionMultiplexer)) as IConnectionMultiplexer;
    }

    public async Task<T?> GetOrSetAsync<T>(
        string key,
        Func<CancellationToken, Task<T?>> factory,
        TimeSpan ttl,
        CancellationToken ct = default)
    {
        // Fast path — no lock overhead on cache hit
        var bytes = await _cache.GetAsync(key, ct);
        if (bytes is not null)
            return Unwrap<T>(bytes);

        // Per-key semaphore: at most one request calls the factory;
        // all others block and read from cache after the lock is released.
        var sem = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await sem.WaitAsync(ct);
        try
        {
            // Double-check: a concurrent waiter may have already set the value
            bytes = await _cache.GetAsync(key, ct);
            if (bytes is not null)
                return Unwrap<T>(bytes);

            var value = await factory(ct);
            var payload = JsonSerializer.SerializeToUtf8Bytes(
                new Envelope<T> { Value = value }, JsonOpts);

            await _cache.SetAsync(key, payload, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            }, ct);

            return value;
        }
        finally
        {
            sem.Release();
        }
    }

    public Task RemoveAsync(string key, CancellationToken ct = default)
        => _cache.RemoveAsync(key, ct);

    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        if (_multiplexer is null) return Task.CompletedTask;

        var endpoint = _multiplexer.GetEndPoints().FirstOrDefault();
        if (endpoint is null) return Task.CompletedTask;

        var db     = _multiplexer.GetDatabase();
        var server = _multiplexer.GetServer(endpoint);

        // Keys() uses SCAN internally (non-blocking on server); batch-delete all matches
        var keys = server.Keys(pattern: $"{prefix}*").ToArray();
        return keys.Length > 0
            ? db.KeyDeleteAsync(keys)
            : Task.CompletedTask;
    }

    private static T? Unwrap<T>(byte[] bytes)
    {
        var envelope = JsonSerializer.Deserialize<Envelope<T>>(bytes, JsonOpts);
        return envelope is not null ? envelope.Value : default;
    }
}
