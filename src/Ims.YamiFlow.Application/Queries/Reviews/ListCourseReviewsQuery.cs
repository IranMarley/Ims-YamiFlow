using Dapper;
using MediatR;

namespace Ims.YamiFlow.Application.Queries.Reviews;

// ── Response ──────────────────────────────────────────
public record ReviewItem(
    Guid ReviewId,
    string StudentName,
    int Rating,
    string Comment,
    DateTime CreatedAt
);

// ── Query ─────────────────────────────────────────────
public record ListCourseReviewsQuery(
    Guid CourseId,
    int Page = 1,
    int PageSize = 10
) : IRequest<PagedResult<ReviewItem>>, IPaginatedQuery;

// ── Handler ───────────────────────────────────────────
public class ListCourseReviewsHandler(IDbConnectionFactory db)
    : IRequestHandler<ListCourseReviewsQuery, PagedResult<ReviewItem>>
{
    public async Task<PagedResult<ReviewItem>> Handle(ListCourseReviewsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT r."Id"                                          AS ReviewId,
                   COALESCE(u."FullName", u."Email", 'Student')   AS StudentName,
                   r."Rating"                                      AS Rating,
                   r."Comment"                                     AS Comment,
                   r."CreatedAt"                                   AS CreatedAt
            FROM "Reviews" r
            INNER JOIN "AspNetUsers" u ON u."Id" = r."StudentId"
            WHERE r."CourseId" = @CourseId
            ORDER BY r."CreatedAt" DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var countSql = """SELECT COUNT(*) FROM "Reviews" WHERE "CourseId" = @CourseId""";

        var param = new { q.CourseId, q.PageSize, Offset = (q.Page - 1) * q.PageSize };

        var items = (await conn.QueryAsync<ReviewItem>(sql, param)).ToList();
        var total = await conn.ExecuteScalarAsync<int>(countSql, new { q.CourseId });

        return new PagedResult<ReviewItem>(items, total, q.Page, q.PageSize);
    }
}
