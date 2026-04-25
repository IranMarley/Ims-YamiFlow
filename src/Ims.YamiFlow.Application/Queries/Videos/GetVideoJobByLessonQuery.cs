using Dapper;
using Ims.YamiFlow.Application.Common;

namespace Ims.YamiFlow.Application.Queries.Videos;

public record GetVideoJobByLessonQuery(Guid LessonId);

public class GetVideoJobByLessonHandler(IDbConnectionFactory db)
    : IHandler<GetVideoJobByLessonQuery, Result<VideoJobStatusResponse>>
{
    public async Task<Result<VideoJobStatusResponse>> Handle(
        GetVideoJobByLessonQuery query, CancellationToken ct)
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
            WHERE  "LessonId" = @LessonId
            ORDER BY "CreatedAt" DESC
            LIMIT  1
            """,
            new { query.LessonId });

        return row is null
            ? Result.Failure<VideoJobStatusResponse>("No job found for this lesson.")
            : Result.Success(row);
    }
}
