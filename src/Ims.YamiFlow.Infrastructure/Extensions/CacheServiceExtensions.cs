using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Infrastructure.Services.Cache;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Ims.YamiFlow.Infrastructure.Extensions;

public static class CacheServiceExtensions
{
    /// <summary>
    /// Registers IDistributedCache (Redis when a connection string is supplied,
    /// otherwise in-process memory), IConnectionMultiplexer (Redis only, used
    /// by RedisCacheService for SCAN-based prefix eviction), and ICacheService.
    ///
    /// The same IConnectionMultiplexer instance is shared with IDistributedCache
    /// so there is only one TCP connection to Redis.
    /// </summary>
    public static IServiceCollection AddRedisCacheInfrastructure(
        this IServiceCollection services, string? redisConnectionString)
    {
        services.AddMemoryCache();

        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            // Single multiplexer shared between IDistributedCache and ICacheService
            var multiplexer = ConnectionMultiplexer.Connect(redisConnectionString);
            services.AddSingleton<IConnectionMultiplexer>(multiplexer);
            services.AddStackExchangeRedisCache(opt =>
            {
                opt.ConnectionMultiplexerFactory =
                    () => Task.FromResult<IConnectionMultiplexer>(multiplexer);
            });
        }
        else
        {
            // Dev / no-Redis fallback — IDistributedCache backed by IMemoryCache
            services.AddDistributedMemoryCache();
        }

        services.AddSingleton<ICacheService, RedisCacheService>();
        return services;
    }
}
