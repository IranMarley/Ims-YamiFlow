using Dapper;

namespace Ims.YamiFlow.Application.Queries.Courses;

// ── Query ─────────────────────────────────────────────
public record ListCoursesQuery(
    string? Search,
    CourseLevel? Level,
    int Page = 1,
    int PageSize = 12
) : IPaginatedQuery;

// ── Response ──────────────────────────────────────────
public record CourseListItem(
    Guid CourseId,
    string Title,
    string Slug,
    string Description,
    string? Thumbnail,
    bool IsFree,
    int Level,
    string InstructorId,
    string? InstructorName,
    int EnrollmentCount,
    DateTime? PublishedAt
);

// ── Handler ───────────────────────────────────────────
public class ListCoursesHandler(IDbConnectionFactory db)
    : IHandler<ListCoursesQuery, PagedResult<CourseListItem>>
{
    public async Task<PagedResult<CourseListItem>> Handle(ListCoursesQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var where = """WHERE c."Status" = 1"""; // Published = 1
        if (!string.IsNullOrWhiteSpace(q.Search))
            where += """ AND c."Title" ILIKE @Search""";
        if (q.Level.HasValue)
            where += """ AND c."Level" = @Level""";

        var sql = $"""
            SELECT c."Id"                  AS CourseId,
                   c."Title"               AS Title,
                   c."Slug"                AS Slug,
                   c."Description"         AS Description,
                   c."Thumbnail"           AS Thumbnail,
                   c."IsFree"              AS IsFree,
                   c."Level"               AS Level,
                   c."InstructorId"        AS InstructorId,
                   u."FullName"            AS InstructorName,
                   COUNT(e."Id")::int      AS EnrollmentCount,
                   c."PublishedAt"         AS PublishedAt
            FROM "Courses" c
            LEFT JOIN "Enrollments" e  ON e."CourseId" = c."Id"
            LEFT JOIN "AspNetUsers"  u ON u."Id"       = c."InstructorId"
            {where}
            GROUP BY c."Id", u."FullName"
            ORDER BY c."PublishedAt" DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var countSql = $"""SELECT COUNT(*) FROM "Courses" c {where}""";

        var param = new
        {
            Search = $"%{q.Search}%",
            Level = (int?)q.Level,
            PageSize = q.PageSize,
            Offset = (q.Page - 1) * q.PageSize
        };

        var items = (await conn.QueryAsync<CourseListItem>(sql, param)).ToList();
        var total = await conn.ExecuteScalarAsync<int>(countSql, param);

        return new PagedResult<CourseListItem>(items, total, q.Page, q.PageSize);
    }
}
