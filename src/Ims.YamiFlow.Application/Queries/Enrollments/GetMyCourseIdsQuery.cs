using Dapper;
using MediatR;

namespace Ims.YamiFlow.Application.Queries.Enrollments;

public record GetMyCourseIdsQuery(string StudentId) : IRequest<IReadOnlyList<Guid>>;

public class GetMyCourseIdsHandler(IDbConnectionFactory db)
    : IRequestHandler<GetMyCourseIdsQuery, IReadOnlyList<Guid>>
{
    public async Task<IReadOnlyList<Guid>> Handle(GetMyCourseIdsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();
        var sql = """
            SELECT "CourseId" FROM "Enrollments"
            WHERE "StudentId" = @StudentId AND "Status" != 2
            """;
        var ids = await conn.QueryAsync<Guid>(sql, new { q.StudentId });
        return ids.ToList();
    }
}
