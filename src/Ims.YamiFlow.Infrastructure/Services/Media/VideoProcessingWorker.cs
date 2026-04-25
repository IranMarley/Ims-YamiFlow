using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Enums;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ims.YamiFlow.Infrastructure.Services.Media;

public sealed class VideoProcessingWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<VideoProcessingWorker> logger) : BackgroundService
{
    private static readonly TimeSpan PollingInterval = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("VideoProcessingWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessNextAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "VideoProcessingWorker encountered an unhandled error.");
            }

            await Task.Delay(PollingInterval, stoppingToken).ConfigureAwait(false);
        }

        logger.LogInformation("VideoProcessingWorker stopped.");
    }

    private async Task ProcessNextAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db      = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ffmpeg  = scope.ServiceProvider.GetRequiredService<FFmpegService>();
        var storage = scope.ServiceProvider.GetRequiredService<IOptions<StorageOptions>>().Value;

        db.AuditDisabled = true;

        // Claim one pending job atomically — concurrent workers cannot pick the same row.
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var job = await db.VideoProcessingJobs
            .FromSqlRaw("""
                SELECT * FROM "VideoProcessingJobs"
                WHERE "Status" = 'Pending'
                ORDER BY "CreatedAt"
                LIMIT 1
                FOR UPDATE SKIP LOCKED
                """)
            .FirstOrDefaultAsync(ct);

        if (job is null)
        {
            await tx.RollbackAsync(ct);
            return;
        }

        job.MarkProcessing();
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        // Process outside the claim transaction so a failure doesn't block the next poll.
        await ProcessJobAsync(db, ffmpeg, storage, job, ct);
    }

    private async Task ProcessJobAsync(
        AppDbContext db,
        FFmpegService ffmpeg,
        StorageOptions storage,
        VideoProcessingJob job,
        CancellationToken ct)
    {
        var inputPath  = Path.Combine(storage.RootPath, job.RawFilePath);
        var hlsDir     = Path.Combine(storage.RootPath, "videos", job.CourseId.ToString(), job.LessonId.ToString(), "hls");
        var thumbPath  = Path.Combine(storage.RootPath, "videos", job.CourseId.ToString(), job.LessonId.ToString(), "thumbnails", "thumb.jpg");

        try
        {
            logger.LogInformation(
                "Processing video. JobId={JobId} LessonId={LessonId}", job.Id, job.LessonId);

            await ffmpeg.GenerateHlsAsync(inputPath, hlsDir, ct);
            await ffmpeg.GenerateThumbnailAsync(inputPath, thumbPath, ct: ct);
            var duration = await ffmpeg.GetDurationAsync(inputPath, ct);

            var hlsRelative   = $"videos/{job.CourseId}/{job.LessonId}/hls/master.m3u8";
            var thumbRelative = $"videos/{job.CourseId}/{job.LessonId}/thumbnails/thumb.jpg";
            var fileSize      = new FileInfo(inputPath).Length;

            // Upsert VideoAsset
            var existing = await db.VideoAssets.FirstOrDefaultAsync(a => a.LessonId == job.LessonId, ct);
            if (existing is null)
                db.VideoAssets.Add(VideoAsset.Create(job.LessonId, hlsRelative, thumbRelative, duration, fileSize));

            // Update lesson ContentUrl so it points to the HLS manifest
            var lesson = await db.Lessons.FindAsync([job.LessonId], ct);
            if (lesson is not null)
                lesson.UpdateContent(hlsRelative, duration);

            job.MarkCompleted();
            await db.SaveChangesAsync(ct);

            logger.LogInformation("Video ready. JobId={JobId} LessonId={LessonId}", job.Id, job.LessonId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Video processing failed. JobId={JobId}", job.Id);
            job.MarkFailed(ex.Message);
            await db.SaveChangesAsync(ct);
        }
    }
}
