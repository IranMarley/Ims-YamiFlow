namespace Ims.YamiFlow.Application.Common;

/// <summary>
/// Central registry of Redis cache key factories.
/// Key pattern:  {resource}:{scope}:{discriminators}
/// Version strategy: course list keys include a prefix; on mutation all
/// matching keys are evicted via RemoveByPrefixAsync(CourseListPrefix).
/// </summary>
public static class CacheKeys
{
    // ── Global / resource-scoped (low volatility) ──────────────────────────
    public const string PlansActive    = "plans:active";      // TTL 1 h
    public const string AdminStats     = "admin:stats";       // TTL 5 min
    public const string CourseListPrefix = "courses:list:";   // prefix for SCAN eviction

    // ── Per-resource ────────────────────────────────────────────────────────
    /// <summary>TTL 15 min. Invalidate on: update, publish, archive, lesson/module changes.</summary>
    public static string CourseDetail(Guid id) => $"course:detail:{id}";

    /// <summary>TTL 5 min. Key encodes all filter + pagination params.</summary>
    public static string CourseList(string? search, CourseLevel? level, bool? isFree, int page, int size)
        => $"courses:list:{search ?? ""}:{(int?)level}:{isFree}:p{page}:s{size}";

    // ── Per-user ────────────────────────────────────────────────────────────
    /// <summary>TTL 2 min. Invalidate on: subscribe, cancel, resume, Stripe webhook.</summary>
    public static string UserSubscription(string userId) => $"sub:current:{userId}";

    /// <summary>TTL 2 min. Invalidate on: enroll, cancel enrollment.</summary>
    public static string UserEnrollments(string userId, int page, int size)
        => $"enrollments:{userId}:p{page}:s{size}";

    public static string UserEnrollmentsPrefix(string userId) => $"enrollments:{userId}:";
}
