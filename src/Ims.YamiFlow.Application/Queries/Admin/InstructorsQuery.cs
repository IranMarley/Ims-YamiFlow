using Dapper;

namespace Ims.YamiFlow.Application.Queries.Admin;

public record InstructorItem(string UserId, string FullName);

public record GetInstructorsQuery;

public class GetInstructorsHandler(IDbConnectionFactory db)
    : IHandler<GetInstructorsQuery, IReadOnlyList<InstructorItem>>
{
    public async Task<IReadOnlyList<InstructorItem>> Handle(GetInstructorsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT u."Id" AS UserId, u."FullName"
            FROM "AspNetUsers" u
            INNER JOIN "AspNetUserRoles" ur ON ur."UserId" = u."Id"
            INNER JOIN "AspNetRoles"     r  ON r."Id"     = ur."RoleId"
            WHERE r."Name" = 'Instructor'
            ORDER BY u."FullName"
            """;

        var rows = await conn.QueryAsync<InstructorItem>(sql);
        return rows.ToList();
    }
}
