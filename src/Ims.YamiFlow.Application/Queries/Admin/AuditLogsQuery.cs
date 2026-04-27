using Dapper;

namespace Ims.YamiFlow.Application.Queries.Admin;

public record AuditLogItem(
    long Id,
    string Source,
    string? EntityName,
    string? Action,
    string? UserId,
    string? UserName,
    string? IpAddress,
    DateTime CreatedAt
);

public record GetAuditLogsQuery(
    string? EntityName,
    string? UserName,
    DateTime? DateFrom,
    DateTime? DateTo,
    int Page = 1,
    int PageSize = 50,
    bool SortAsc = false
) : IPaginatedQuery;

public class GetAuditLogsHandler(IDbConnectionFactory db)
    : IHandler<GetAuditLogsQuery, PagedResult<AuditLogItem>>
{
    public async Task<PagedResult<AuditLogItem>> Handle(GetAuditLogsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var offset = (q.Page - 1) * q.PageSize;
        var order  = q.SortAsc ? "ASC" : "DESC";

        var countSql = """
            SELECT COUNT(*)::int
            FROM audit."AuditLogs" al
            WHERE (@EntityName IS NULL OR al."EntityName" = @EntityName)
              AND (@UserName   IS NULL OR al."UserName"   ILIKE '%' || @UserName || '%')
              AND (@DateFrom   IS NULL OR al."CreatedAt"  >= @DateFrom)
              AND (@DateTo     IS NULL OR al."CreatedAt"  <  @DateTo)
            """;

        var dataSql = $"""
            SELECT
                al."Id",
                al."Source",
                al."EntityName",
                al."Action",
                al."UserId",
                al."UserName",
                al."IpAddress",
                al."CreatedAt"
            FROM audit."AuditLogs" al
            WHERE (@EntityName IS NULL OR al."EntityName" = @EntityName)
              AND (@UserName   IS NULL OR al."UserName"   ILIKE '%' || @UserName || '%')
              AND (@DateFrom   IS NULL OR al."CreatedAt"  >= @DateFrom)
              AND (@DateTo     IS NULL OR al."CreatedAt"  <  @DateTo)
            ORDER BY al."CreatedAt" {order}
            OFFSET @Offset LIMIT @PageSize
            """;

        var parameters = new
        {
            EntityName = string.IsNullOrWhiteSpace(q.EntityName) ? null : q.EntityName,
            UserName   = string.IsNullOrWhiteSpace(q.UserName)   ? null : q.UserName,
            q.DateFrom,
            q.DateTo,
            Offset   = offset,
            PageSize = q.PageSize
        };

        var total = await conn.QueryFirstAsync<int>(countSql, parameters);
        var rows  = await conn.QueryAsync<AuditLogItem>(dataSql, parameters);

        return new PagedResult<AuditLogItem>(rows.ToList(), total, q.Page, q.PageSize);
    }
}
