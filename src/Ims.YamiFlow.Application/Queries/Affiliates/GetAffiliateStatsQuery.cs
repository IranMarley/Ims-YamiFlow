
namespace Ims.YamiFlow.Application.Queries.Affiliates;

// ── Response ──────────────────────────────────────────
public record AffiliateStats(
    int TotalLinks,
    int TotalClicks,
    int TotalConversions,
    decimal TotalEarnings
);

// ── Query ─────────────────────────────────────────────
public record GetAffiliateStatsQuery(string UserId);

// ── Handler ───────────────────────────────────────────
public class GetAffiliateStatsHandler(IDbConnectionFactory db)
    : IHandler<GetAffiliateStatsQuery, Result<AffiliateStats>>
{
    public Task<Result<AffiliateStats>> Handle(GetAffiliateStatsQuery q, CancellationToken ct)
    {
        // TODO: Query AffiliateLinks + AffiliateClicks tables via Dapper
        var stats = new AffiliateStats(0, 0, 0, 0m);
        return Task.FromResult(Result.Success(stats));
    }
}
