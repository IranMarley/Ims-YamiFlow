namespace Ims.YamiFlow.API.Extensions;

public static class RateLimitPolicies
{
    // Named limiters
    public const string Auth = "auth";

    // Partition prefixes used by the global partitioned limiter
    public const string AnonymousPartitionPrefix = "anon:";
    public const string UserPartitionPrefix = "user:";
}

