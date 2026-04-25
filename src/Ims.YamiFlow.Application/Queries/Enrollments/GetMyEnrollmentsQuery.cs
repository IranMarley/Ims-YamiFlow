using Dapper;

namespace Ims.YamiFlow.Application.Queries.Enrollments;

// ── Query ─────────────────────────────────────────────
public record GetMyEnrollmentsQuery(string StudentId, int Page = 1, int PageSize = 10) : IPaginatedQuery;

// ── Response ──────────────────────────────────────────
public record EnrollmentItem(
    Guid EnrollmentId,
    Guid CourseId,
    string CourseTitle,
    string CourseSlug,
    string? CourseThumbnail,
    int Status,
    int CompletedLessons,
    int TotalLessons,
    decimal ProgressPercent,
    DateTime EnrolledAt,
    DateTime? CompletedAt
);

// ── Handler ───────────────────────────────────────────
public class GetMyEnrollmentsHandler(IDbConnectionFactory db)
    : IHandler<GetMyEnrollmentsQuery, PagedResult<EnrollmentItem>>
{
    public async Task<PagedResult<EnrollmentItem>> Handle(GetMyEnrollmentsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT e."Id"                                              AS EnrollmentId,
                   e."CourseId"                                        AS CourseId,
                   c."Title"                                           AS CourseTitle,
                   c."Slug"                                            AS CourseSlug,
                   c."Thumbnail"                                       AS CourseThumbnail,
                   e."Status"                                          AS Status,
                   COUNT(DISTINCT lp."LessonId")::int                  AS CompletedLessons,
                   COUNT(DISTINCT l."Id")::int                         AS TotalLessons,
                   CASE
                     WHEN COUNT(DISTINCT l."Id") = 0 THEN 0
                     ELSE ROUND(COUNT(DISTINCT lp."LessonId") * 100.0 / COUNT(DISTINCT l."Id"), 2)
                   END                                                  AS ProgressPercent,
                   e."EnrolledAt"                                       AS EnrolledAt,
                   e."CompletedAt"                                      AS CompletedAt
            FROM "Enrollments" e
            INNER JOIN "Courses"  c  ON c."Id" = e."CourseId"
            LEFT  JOIN "Modules"  m  ON m."CourseId"      = c."Id"
            LEFT  JOIN "Lessons"  l  ON l."ModuleId"      = m."Id"
            LEFT  JOIN "LessonProgresses" lp ON lp."EnrollmentId" = e."Id"
                                             AND lp."LessonId"    = l."Id"
            WHERE e."StudentId" = @StudentId
              AND e."Status"    != 2
            GROUP BY e."Id", c."Id"
            ORDER BY e."EnrolledAt" DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var countSql = """
            SELECT COUNT(*) FROM "Enrollments" WHERE "StudentId" = @StudentId AND "Status" != 2
            """;

        var param = new { q.StudentId, q.PageSize, Offset = (q.Page - 1) * q.PageSize };

        var items = (await conn.QueryAsync<EnrollmentItem>(sql, param)).ToList();
        var total = await conn.ExecuteScalarAsync<int>(countSql, new { q.StudentId });

        return new PagedResult<EnrollmentItem>(items, total, q.Page, q.PageSize);
    }
}
