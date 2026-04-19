using Dapper;
using MediatR;

namespace Ims.YamiFlow.Application.Queries.Forum;

// ── Response ──────────────────────────────────────────
public record PostItem(
    Guid PostId,
    string AuthorName,
    Guid? CourseId,
    string Title,
    string BodyPreview,
    int ReplyCount,
    DateTime CreatedAt
);

// ── Query ─────────────────────────────────────────────
public record ListPostsQuery(
    Guid? CourseId,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<PostItem>>, IPaginatedQuery;

// ── Handler ───────────────────────────────────────────
public class ListPostsHandler(IDbConnectionFactory db)
    : IRequestHandler<ListPostsQuery, PagedResult<PostItem>>
{
    public async Task<PagedResult<PostItem>> Handle(ListPostsQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var where = q.CourseId.HasValue
            ? """WHERE p."CourseId" = @CourseId"""
            : "";

        var sql = $"""
            SELECT p."Id"                                           AS PostId,
                   COALESCE(u."FullName", u."Email", 'User')        AS AuthorName,
                   p."CourseId"                                     AS CourseId,
                   p."Title"                                        AS Title,
                   LEFT(p."Body", 200)                              AS BodyPreview,
                   COUNT(r."Id")::int                               AS ReplyCount,
                   p."CreatedAt"                                    AS CreatedAt
            FROM "ForumPosts" p
            INNER JOIN "AspNetUsers" u ON u."Id" = p."AuthorId"
            LEFT  JOIN "ForumReplies" r ON r."PostId" = p."Id"
            {where}
            GROUP BY p."Id", u."FullName", u."Email"
            ORDER BY p."CreatedAt" DESC
            LIMIT @PageSize OFFSET @Offset
            """;

        var countSql = $"""SELECT COUNT(*) FROM "ForumPosts" p {where}""";

        var param = new { q.CourseId, q.PageSize, Offset = (q.Page - 1) * q.PageSize };

        var items = (await conn.QueryAsync<PostItem>(sql, param)).ToList();
        var total = await conn.ExecuteScalarAsync<int>(countSql, param);

        return new PagedResult<PostItem>(items, total, q.Page, q.PageSize);
    }
}
