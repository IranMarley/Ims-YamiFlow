using Dapper;

namespace Ims.YamiFlow.Application.Queries.Coupons;

// ── Response ──────────────────────────────────────────
public record CouponItem(
    Guid CouponId,
    string Code,
    decimal Discount,
    bool IsPercentage,
    DateTime? ExpiresAt,
    int? MaxUses,
    int UsedCount
);

// ── Query ─────────────────────────────────────────────
public record ListCouponsQuery(int Page = 1, int PageSize = 20) : IPaginatedQuery;

// ── Handler ───────────────────────────────────────────
public class ListCouponsHandler(IDbConnectionFactory db)
    : IHandler<ListCouponsQuery, PagedResult<CouponItem>>
{
    public async Task<PagedResult<CouponItem>> Handle(ListCouponsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT c."Id"           AS CouponId,
                   c."Code"         AS Code,
                   c."Value"        AS Discount,
                   CASE WHEN c."Type" = 0 THEN true ELSE false END AS IsPercentage,
                   c."ExpiresAt"    AS ExpiresAt,
                   c."MaxUses"      AS MaxUses,
                   c."CurrentUses"  AS UsedCount
            FROM "Coupons" c
            ORDER BY c."ExpiresAt" DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var countSql = """SELECT COUNT(*) FROM "Coupons" """;

        var param = new { q.PageSize, Offset = (q.Page - 1) * q.PageSize };

        var items = (await conn.QueryAsync<CouponItem>(sql, param)).ToList();
        var total = await conn.ExecuteScalarAsync<int>(countSql);

        return new PagedResult<CouponItem>(items, total, q.Page, q.PageSize);
    }
}
