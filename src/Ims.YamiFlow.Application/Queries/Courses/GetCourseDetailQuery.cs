using Dapper;
using MediatR;

namespace Ims.YamiFlow.Application.Queries.Courses;

// ── Query ─────────────────────────────────────────────
public record GetCourseDetailQuery(Guid CourseId) : IRequest<Result<CourseDetailResponse>>;

// ── Response ──────────────────────────────────────────
public record LessonDetail(
    Guid LessonId,
    string Title,
    int Order,
    int Type,
    int DurationSeconds,
    string? ContentUrl,
    bool IsFreePreview
);

public record ModuleDetail(
    Guid ModuleId,
    string Title,
    int Order,
    IReadOnlyList<LessonDetail> Lessons
);

public record CourseDetailResponse(
    Guid CourseId,
    string Title,
    string Slug,
    string Description,
    string? Thumbnail,
    bool IsFree,
    int Level,
    int Status,
    string InstructorId,
    DateTime? PublishedAt,
    int EnrollmentCount,
    IReadOnlyList<ModuleDetail> Modules
);

// ── Private DTOs (Dapper row mapping) ─────────────────
file sealed class CourseRow
{
    public Guid CourseId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string? Thumbnail { get; init; }
    public bool IsFree { get; init; }
    public int Level { get; init; }
    public int Status { get; init; }
    public string InstructorId { get; init; } = string.Empty;
    public DateTime? PublishedAt { get; init; }
    public int EnrollmentCount { get; init; }
}

file sealed class ModuleRow
{
    public Guid ModuleId { get; init; }
    public string Title { get; init; } = string.Empty;
    public int Order { get; init; }
}

file sealed class LessonRow
{
    public Guid LessonId { get; init; }
    public Guid ModuleId { get; init; }
    public string Title { get; init; } = string.Empty;
    public int Order { get; init; }
    public int Type { get; init; }
    public int DurationSeconds { get; init; }
    public string? ContentUrl { get; init; }
    public bool IsFreePreview { get; init; }
}

// ── Handler ───────────────────────────────────────────
public class GetCourseDetailHandler(IDbConnectionFactory db)
    : IRequestHandler<GetCourseDetailQuery, Result<CourseDetailResponse>>
{
    public async Task<Result<CourseDetailResponse>> Handle(GetCourseDetailQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var courseSql = """
            SELECT c."Id"                  AS CourseId,
                   c."Title"               AS Title,
                   c."Slug"                AS Slug,
                   c."Description"         AS Description,
                   c."Thumbnail"           AS Thumbnail,
                   c."IsFree"              AS IsFree,
                   c."Level"               AS Level,
                   c."Status"              AS Status,
                   c."InstructorId"        AS InstructorId,
                   c."PublishedAt"         AS PublishedAt,
                   COUNT(e."Id")::int      AS EnrollmentCount
            FROM "Courses" c
            LEFT JOIN "Enrollments" e ON e."CourseId" = c."Id"
            WHERE c."Id" = @CourseId
            GROUP BY c."Id"
            """;

        var moduleSql = """
            SELECT m."Id"    AS ModuleId,
                   m."Title" AS Title,
                   m."Order" AS Order
            FROM "Modules" m
            WHERE m."CourseId" = @CourseId
            ORDER BY m."Order"
            """;

        var lessonSql = """
            SELECT l."Id"              AS LessonId,
                   l."ModuleId"        AS ModuleId,
                   l."Title"           AS Title,
                   l."Order"           AS Order,
                   l."Type"            AS Type,
                   l."DurationSeconds" AS DurationSeconds,
                   l."ContentUrl"      AS ContentUrl,
                   l."IsFreePreview"   AS IsFreePreview
            FROM "Lessons" l
            INNER JOIN "Modules" m ON m."Id" = l."ModuleId"
            WHERE m."CourseId" = @CourseId
            ORDER BY m."Order", l."Order"
            """;

        using var multi = await conn.QueryMultipleAsync(
            $"{courseSql}; {moduleSql}; {lessonSql}",
            new { q.CourseId });

        var course = await multi.ReadFirstOrDefaultAsync<CourseRow>();
        if (course is null)
            return Result.Failure<CourseDetailResponse>("Course not found.");

        var modules = (await multi.ReadAsync<ModuleRow>()).ToList();
        var lessons = (await multi.ReadAsync<LessonRow>()).ToList();

        var moduleDetails = modules.Select(m =>
        {
            var moduleLessons = lessons
                .Where(l => l.ModuleId == m.ModuleId)
                .Select(l => new LessonDetail(
                    l.LessonId,
                    l.Title,
                    l.Order,
                    l.Type,
                    l.DurationSeconds,
                    l.ContentUrl,
                    l.IsFreePreview))
                .ToList();

            return new ModuleDetail(m.ModuleId, m.Title, m.Order, moduleLessons);
        }).ToList();

        var response = new CourseDetailResponse(
            course.CourseId,
            course.Title,
            course.Slug,
            course.Description,
            course.Thumbnail,
            course.IsFree,
            course.Level,
            course.Status,
            course.InstructorId,
            course.PublishedAt,
            course.EnrollmentCount,
            moduleDetails);

        return Result.Success(response);
    }
}
