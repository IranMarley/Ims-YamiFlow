using Dapper;

namespace Ims.YamiFlow.Application.Queries.Admin;

public record AdminCourseItem(
    Guid CourseId,
    string Title,
    string Slug,
    bool IsFree,
    int Status,
    int Level,
    string InstructorId,
    string? InstructorName,
    int EnrollmentCount,
    DateTime CreatedAt,
    DateTime? PublishedAt
);

public record GetAdminCoursesQuery(
    string? Search,
    string? InstructorId,
    int? Status,
    int Page = 1,
    int PageSize = 20
) : IPaginatedQuery;

public class GetAdminCoursesHandler(IDbConnectionFactory db)
    : IHandler<GetAdminCoursesQuery, PagedResult<AdminCourseItem>>
{
    public async Task<PagedResult<AdminCourseItem>> Handle(GetAdminCoursesQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var offset = (q.Page - 1) * q.PageSize;

        var countSql = """
            SELECT COUNT(*)::int
            FROM "Courses" c
            WHERE (@Search IS NULL OR c."Title" ILIKE '%' || @Search || '%')
              AND (@InstructorId IS NULL OR c."InstructorId" = @InstructorId)
              AND (@Status IS NULL OR c."Status" = @Status)
            """;

        var dataSql = """
            SELECT
                c."Id"               AS CourseId,
                c."Title"            AS Title,
                c."Slug"             AS Slug,
                c."IsFree"           AS IsFree,
                c."Status"           AS Status,
                c."Level"            AS Level,
                c."InstructorId"     AS InstructorId,
                u."FullName"         AS InstructorName,
                COUNT(e."Id")::int   AS EnrollmentCount,
                c."CreatedAt"        AS CreatedAt,
                c."PublishedAt"      AS PublishedAt
            FROM "Courses" c
            LEFT JOIN "Enrollments" e  ON e."CourseId" = c."Id"
            LEFT JOIN "AspNetUsers"  u ON u."Id" = c."InstructorId"
            WHERE (@Search IS NULL OR c."Title" ILIKE '%' || @Search || '%')
              AND (@InstructorId IS NULL OR c."InstructorId" = @InstructorId)
              AND (@Status IS NULL OR c."Status" = @Status)
            GROUP BY c."Id", u."FullName"
            ORDER BY c."CreatedAt" DESC
            OFFSET @Offset LIMIT @PageSize
            """;

        var parameters = new
        {
            Search = string.IsNullOrWhiteSpace(q.Search) ? null : q.Search,
            InstructorId = string.IsNullOrWhiteSpace(q.InstructorId) ? null : q.InstructorId,
            q.Status,
            Offset = offset,
            PageSize = q.PageSize
        };

        var total = await conn.QueryFirstAsync<int>(countSql, parameters);
        var rows = await conn.QueryAsync<AdminCourseItem>(dataSql, parameters);

        return new PagedResult<AdminCourseItem>(rows.ToList(), total, q.Page, q.PageSize);
    }
}
