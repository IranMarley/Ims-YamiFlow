using Dapper;

namespace Ims.YamiFlow.Application.Queries.Admin;

// ── Responses ─────────────────────────────────────────
public record AdminStatsResponse(
    int TotalUsers,
    int TotalCourses,
    int TotalEnrollments,
    decimal TotalRevenue
);

public record UserItem(
    string UserId,
    string Email,
    string FullName,
    bool IsActive,
    DateTime CreatedAt,
    IReadOnlyList<string> Roles
);

// ── Private DTO ───────────────────────────────────────
file sealed class UserRow
{
    public string UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? RoleNames { get; init; }
}

// ── GetAdminStatsQuery ────────────────────────────────
public record GetAdminStatsQuery;

public class GetAdminStatsHandler(IDbConnectionFactory db)
    : IHandler<GetAdminStatsQuery, Result<AdminStatsResponse>>
{
    public async Task<Result<AdminStatsResponse>> Handle(GetAdminStatsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT
                (SELECT COUNT(*)::int FROM "AspNetUsers")    AS TotalUsers,
                (SELECT COUNT(*)::int FROM "Courses")        AS TotalCourses,
                (SELECT COUNT(*)::int FROM "Enrollments")    AS TotalEnrollments,
                COALESCE(
                    (SELECT SUM(c."Price")
                     FROM "Enrollments" e
                     INNER JOIN "Courses" c ON c."Id" = e."CourseId"), 0
                )::numeric AS TotalRevenue
            """;

        var row = await conn.QueryFirstAsync<AdminStatsResponse>(sql);
        return Result.Success(row);
    }
}

// ── ListUsersQuery ────────────────────────────────────
public record ListUsersQuery(
    string? Search,
    int Page = 1,
    int PageSize = 20
) : IPaginatedQuery;

public class ListUsersHandler(IDbConnectionFactory db)
    : IHandler<ListUsersQuery, PagedResult<UserItem>>
{
    public async Task<PagedResult<UserItem>> Handle(ListUsersQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var search = string.IsNullOrWhiteSpace(q.Search) ? null : q.Search.Trim();
        var offset = (q.Page - 1) * q.PageSize;

        var countSql = """
            SELECT COUNT(*)::int
            FROM "AspNetUsers" u
            WHERE @Search IS NULL
               OR u."Email"    ILIKE '%' || @Search || '%'
               OR u."FullName" ILIKE '%' || @Search || '%'
            """;

        var dataSql = """
            SELECT
                u."Id"       AS UserId,
                u."Email"    AS Email,
                u."FullName" AS FullName,
                u."IsActive" AS IsActive,
                u."CreatedAt" AS CreatedAt,
                STRING_AGG(r."Name", ',') AS RoleNames
            FROM "AspNetUsers" u
            LEFT JOIN "AspNetUserRoles" ur ON ur."UserId" = u."Id"
            LEFT JOIN "AspNetRoles"     r  ON r."Id"     = ur."RoleId"
            WHERE @Search IS NULL
               OR u."Email"    ILIKE '%' || @Search || '%'
               OR u."FullName" ILIKE '%' || @Search || '%'
            GROUP BY u."Id", u."Email", u."FullName", u."IsActive", u."CreatedAt"
            ORDER BY u."CreatedAt" DESC
            OFFSET @Offset LIMIT @PageSize
            """;

        var parameters = new { Search = search, Offset = offset, PageSize = q.PageSize };

        var total = await conn.QueryFirstAsync<int>(countSql, parameters);
        var rows = await conn.QueryAsync<UserRow>(dataSql, parameters);

        var items = rows.Select(r => new UserItem(
            r.UserId,
            r.Email,
            r.FullName,
            r.IsActive,
            r.CreatedAt,
            r.RoleNames?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? []
        )).ToList();

        return new PagedResult<UserItem>(items, total, q.Page, q.PageSize);
    }
}
