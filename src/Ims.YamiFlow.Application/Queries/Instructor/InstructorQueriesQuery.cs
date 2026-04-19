using Dapper;
using Ims.YamiFlow.Application.Queries.Courses;

namespace Ims.YamiFlow.Application.Queries.Instructor;

// ── Responses ─────────────────────────────────────────
public record InstructorStats(
    int TotalCourses,
    int TotalStudents,
    int TotalEnrollments,
    decimal TotalRevenue
);

// ── GetMyCoursesQuery ─────────────────────────────────
public record GetMyCoursesQuery(
    string InstructorId,
    int Page = 1,
    int PageSize = 12
) : IPaginatedQuery;

public class GetMyCoursesHandler(IDbConnectionFactory db)
    : IHandler<GetMyCoursesQuery, PagedResult<CourseListItem>>
{
    public async Task<PagedResult<CourseListItem>> Handle(GetMyCoursesQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT c."Id"                AS CourseId,
                   c."Title"             AS Title,
                   c."Slug"              AS Slug,
                   c."Description"       AS Description,
                   c."Thumbnail"         AS Thumbnail,
                   c."IsFree"            AS IsFree,
                   c."Level"             AS Level,
                   c."InstructorId"      AS InstructorId,
                   u."FullName"          AS InstructorName,
                   COUNT(e."Id")::int    AS EnrollmentCount,
                   c."PublishedAt"       AS PublishedAt
            FROM "Courses" c
            LEFT JOIN "Enrollments" e ON e."CourseId" = c."Id"
            LEFT JOIN "AspNetUsers" u ON u."Id" = c."InstructorId"
            WHERE c."InstructorId" = @InstructorId
            GROUP BY c."Id", u."FullName"
            ORDER BY c."CreatedAt" DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var countSql = """SELECT COUNT(*) FROM "Courses" WHERE "InstructorId" = @InstructorId""";

        var param = new
        {
            InstructorId = q.InstructorId,
            PageSize = q.PageSize,
            Offset = (q.Page - 1) * q.PageSize
        };

        var items = (await conn.QueryAsync<CourseListItem>(sql, param)).ToList();
        var total = await conn.ExecuteScalarAsync<int>(countSql, param);

        return new PagedResult<CourseListItem>(items, total, q.Page, q.PageSize);
    }
}

// ── GetMyStatsQuery ───────────────────────────────────
public record GetMyStatsQuery(string InstructorId);

public class GetMyStatsHandler(IDbConnectionFactory db)
    : IHandler<GetMyStatsQuery, Result<InstructorStats>>
{
    public async Task<Result<InstructorStats>> Handle(GetMyStatsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT
                COUNT(DISTINCT c."Id")::int           AS TotalCourses,
                COUNT(DISTINCT e."StudentId")::int    AS TotalStudents,
                COUNT(e."Id")::int                    AS TotalEnrollments,
                0::numeric AS TotalRevenue
            FROM "Courses" c
            LEFT JOIN "Enrollments" e ON e."CourseId" = c."Id"
            WHERE c."InstructorId" = @InstructorId
            """;

        var result = await conn.QuerySingleOrDefaultAsync<InstructorStats>(sql, new { q.InstructorId });
        return Result.Success(result ?? new InstructorStats(0, 0, 0, 0m));
    }
}
