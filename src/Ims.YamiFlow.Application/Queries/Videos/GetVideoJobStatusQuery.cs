using Dapper;
using Ims.YamiFlow.Application.Common;

namespace Ims.YamiFlow.Application.Queries.Videos;

// ── Query ─────────────────────────────────────────────
public record GetVideoJobStatusQuery(Guid JobId);

// ── Response ──────────────────────────────────────────
public record VideoJobStatusResponse(
    Guid JobId,
    Guid LessonId,
    string Status,
    int RetryCount,
    string? ErrorMessage,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt
);

// ── Handler ───────────────────────────────────────────
public class GetVideoJobStatusHandler(IDbConnectionFactory db)
    : IHandler<GetVideoJobStatusQuery, Result<VideoJobStatusResponse>>
{
    public async Task<Result<VideoJobStatusResponse>> Handle(
        GetVideoJobStatusQuery query, CancellationToken ct)
    {
        using var conn = db.Create();

        var row = await conn.QueryFirstOrDefaultAsync<VideoJobStatusResponse>(
            """
            SELECT "Id"           AS "JobId",
                   "LessonId",
                   "Status",
                   "RetryCount",
                   "ErrorMessage",
                   "CreatedAt",
                   "StartedAt",
                   "CompletedAt"
            FROM   "VideoProcessingJobs"
            WHERE  "Id" = @JobId
            """,
            new { query.JobId });

        return row is null
            ? Result.Failure<VideoJobStatusResponse>("Job not found.")
            : Result.Success(row);
    }
}
