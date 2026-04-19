using Dapper;

namespace Ims.YamiFlow.Application.Queries.Forum;

// ── Response ──────────────────────────────────────────
public record ReplyItem(Guid ReplyId, string AuthorName, string Body, DateTime CreatedAt);

public record PostDetail(
    Guid PostId,
    string AuthorName,
    Guid? CourseId,
    string Title,
    string Body,
    IReadOnlyList<ReplyItem> Replies,
    DateTime CreatedAt
);

// ── Private DTOs ──────────────────────────────────────
file sealed class PostRow
{
    public Guid PostId { get; init; }
    public string AuthorName { get; init; } = string.Empty;
    public Guid? CourseId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

file sealed class ReplyRow
{
    public Guid ReplyId { get; init; }
    public string AuthorName { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

// ── Query ─────────────────────────────────────────────
public record GetPostDetailQuery(Guid PostId);

// ── Handler ───────────────────────────────────────────
public class GetPostDetailHandler(IDbConnectionFactory db)
    : IHandler<GetPostDetailQuery, Result<PostDetail>>
{
    public async Task<Result<PostDetail>> Handle(GetPostDetailQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var postSql = """
            SELECT p."Id"                                           AS PostId,
                   COALESCE(u."FullName", u."Email", 'User')        AS AuthorName,
                   p."CourseId"                                     AS CourseId,
                   p."Title"                                        AS Title,
                   p."Body"                                         AS Body,
                   p."CreatedAt"                                    AS CreatedAt
            FROM "ForumPosts" p
            INNER JOIN "AspNetUsers" u ON u."Id" = p."AuthorId"
            WHERE p."Id" = @PostId
            """;

        var replySql = """
            SELECT r."Id"                                           AS ReplyId,
                   COALESCE(u."FullName", u."Email", 'User')        AS AuthorName,
                   r."Body"                                         AS Body,
                   r."CreatedAt"                                    AS CreatedAt
            FROM "ForumReplies" r
            INNER JOIN "AspNetUsers" u ON u."Id" = r."AuthorId"
            WHERE r."PostId" = @PostId
            ORDER BY r."CreatedAt"
            """;

        using var multi = await conn.QueryMultipleAsync(
            $"{postSql}; {replySql}", new { q.PostId });

        var post = await multi.ReadFirstOrDefaultAsync<PostRow>();
        if (post is null)
            return Result.Failure<PostDetail>("Post not found.");

        var replies = (await multi.ReadAsync<ReplyRow>())
            .Select(r => new ReplyItem(r.ReplyId, r.AuthorName, r.Body, r.CreatedAt))
            .ToList();

        return Result.Success(new PostDetail(
            post.PostId, post.AuthorName, post.CourseId,
            post.Title, post.Body, replies, post.CreatedAt));
    }
}
