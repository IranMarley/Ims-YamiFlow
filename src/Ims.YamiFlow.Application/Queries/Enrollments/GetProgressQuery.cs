using Dapper;

namespace Ims.YamiFlow.Application.Queries.Enrollments;

// ── Query ─────────────────────────────────────────────
public record GetProgressQuery(Guid EnrollmentId, string StudentId)
   ;

// ── Response ──────────────────────────────────────────
public record LessonProgressItem(
    Guid LessonId,
    string LessonTitle,
    bool Completed,
    int WatchedSeconds,
    DateTime? CompletedAt
);

public record ProgressResponse(
    Guid EnrollmentId,
    Guid CourseId,
    string CourseTitle,
    decimal ProgressPercent,
    int CompletedLessons,
    int TotalLessons,
    IReadOnlyList<LessonProgressItem> Lessons
);

// ── Handler ───────────────────────────────────────────
public class GetProgressHandler(IDbConnectionFactory db)
    : IHandler<GetProgressQuery, Result<ProgressResponse>>
{
    public async Task<Result<ProgressResponse>> Handle(GetProgressQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var enrollSql = """
            SELECT e."Id" AS EnrollmentId, e."CourseId", c."Title" AS CourseTitle,
                   e."StudentId"
            FROM "Enrollments" e
            INNER JOIN "Courses" c ON c."Id" = e."CourseId"
            WHERE e."Id" = @EnrollmentId
            """;

        var enrollment = await conn.QueryFirstOrDefaultAsync<dynamic>(enrollSql, new { q.EnrollmentId });
        if (enrollment is null)
            return Result.Failure<ProgressResponse>("Enrollment not found.");

        if ((string)enrollment.StudentId != q.StudentId)
            return Result.Failure<ProgressResponse>("Access denied.");

        var lessonSql = """
            SELECT l."Id"              AS LessonId,
                   l."Title"           AS LessonTitle,
                   lp."LessonId"  IS NOT NULL AS Completed,
                   COALESCE(lp."WatchedSeconds", 0) AS WatchedSeconds,
                   lp."CompletedAt"   AS CompletedAt
            FROM "Modules" m
            INNER JOIN "Lessons" l ON l."ModuleId" = m."Id"
            LEFT  JOIN "LessonProgresses" lp ON lp."EnrollmentId" = @EnrollmentId
                                             AND lp."LessonId"    = l."Id"
            WHERE m."CourseId" = @CourseId
            ORDER BY m."Order", l."Order"
            """;

        var lessons = (await conn.QueryAsync<LessonProgressItem>(
            lessonSql,
            new { q.EnrollmentId, CourseId = (Guid)enrollment.CourseId })).ToList();

        var total = lessons.Count;
        var completed = lessons.Count(l => l.Completed);
        var progress = total == 0 ? 0m : Math.Round(completed * 100m / total, 2);

        return Result.Success(new ProgressResponse(
            q.EnrollmentId,
            (Guid)enrollment.CourseId,
            (string)enrollment.CourseTitle,
            progress,
            completed,
            total,
            lessons));
    }
}
