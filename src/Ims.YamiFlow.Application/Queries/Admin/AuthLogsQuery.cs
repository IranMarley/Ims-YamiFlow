using Dapper;

namespace Ims.YamiFlow.Application.Queries.Admin;

public record AuthLogItem(
    long Id,
    string EventType,
    string? UserId,
    string? Email,
    bool Success,
    string? FailureReason,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt
);

public record GetAuthLogsQuery(
    string? Email,
    bool? Success,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page = 1,
    int PageSize = 50
) : IPaginatedQuery;

public class GetAuthLogsHandler(IDbConnectionFactory db)
    : IHandler<GetAuthLogsQuery, PagedResult<AuthLogItem>>
{
    public async Task<PagedResult<AuthLogItem>> Handle(GetAuthLogsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var offset = (q.Page - 1) * q.PageSize;

        var countSql = """
            SELECT COUNT(*)::int
            FROM audit."AuthEvents" ae
            WHERE (@Email    IS NULL OR ae."Email"     ILIKE '%' || @Email || '%')
              AND (@Success  IS NULL OR ae."Success"   = @Success)
              AND (@DateFrom IS NULL OR ae."CreatedAt" >= @DateFrom)
              AND (@DateTo   IS NULL OR ae."CreatedAt" <  @DateTo)
            """;

        var dataSql = """
            SELECT
                ae."Id",
                ae."EventType",
                ae."UserId",
                ae."Email",
                ae."Success",
                ae."FailureReason",
                ae."IpAddress",
                ae."UserAgent",
                ae."CreatedAt"
            FROM audit."AuthEvents" ae
            WHERE (@Email    IS NULL OR ae."Email"     ILIKE '%' || @Email || '%')
              AND (@Success  IS NULL OR ae."Success"   = @Success)
              AND (@DateFrom IS NULL OR ae."CreatedAt" >= @DateFrom)
              AND (@DateTo   IS NULL OR ae."CreatedAt" <  @DateTo)
            ORDER BY ae."CreatedAt" DESC
            OFFSET @Offset LIMIT @PageSize
            """;

        var parameters = new
        {
            Email    = string.IsNullOrWhiteSpace(q.Email) ? null : q.Email,
            q.Success,
            q.DateFrom,
            q.DateTo,
            Offset   = offset,
            PageSize = q.PageSize
        };

        var total = await conn.QueryFirstAsync<int>(countSql, parameters);
        var rows  = await conn.QueryAsync<AuthLogItem>(dataSql, parameters);

        return new PagedResult<AuthLogItem>(rows.ToList(), total, q.Page, q.PageSize);
    }
}
