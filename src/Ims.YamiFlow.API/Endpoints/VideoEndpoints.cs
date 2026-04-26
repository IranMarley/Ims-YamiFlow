using System.Security.Claims;
using Dapper;
using Ims.YamiFlow.Application.Commands.Videos;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Videos;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Services.Media;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Ims.YamiFlow.API.Endpoints;

public static class VideoEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        // ── Upload ─────────────────────────────────────────────────────────────
        app.MapPost("/api/courses/{courseId:guid}/lessons/{lessonId:guid}/video", Upload)
            .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Update))
            .DisableAntiforgery()
            .WithTags(Resources.Lesson)
            .WithName("UploadVideo")
            .Accepts<IFormFile>("multipart/form-data")
            .WithMetadata(new RequestSizeLimitAttribute(UploadVideoValidator.MaxBytes))
            .WithMetadata(new RequestFormLimitsAttribute { MultipartBodyLengthLimit = UploadVideoValidator.MaxBytes });

        // ── Job status ─────────────────────────────────────────────────────────
        app.MapGet("/api/video-jobs/{jobId:guid}", GetJobStatus)
            .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Read))
            .WithTags(Resources.Lesson)
            .WithName("GetVideoJobStatus");

        // ── Latest job by lesson ───────────────────────────────────────────────
        app.MapGet("/api/lessons/{lessonId:guid}/video-job", GetJobByLesson)
            .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Update))
            .WithTags(Resources.Lesson)
            .WithName("GetVideoJobByLesson");

        // ── Stream manifest ────────────────────────────────────────────────────
        // AllowAnonymous: free-preview lessons are accessible without login.
        // Manual access check runs inside the handler.
        // DisableRateLimiting: HLS players generate many rapid requests; access is enforced in the handler.
        app.MapGet("/api/lessons/{lessonId:guid}/video/manifest", GetManifest)
            .AllowAnonymous()
            .DisableRateLimiting()
            .WithTags(Resources.Lesson)
            .WithName("GetVideoManifest");

        // ── HLS segments / sub-playlists ───────────────────────────────────────
        app.MapGet("/api/lessons/{lessonId:guid}/video/hls/{**filePath}", GetHlsFile)
            .AllowAnonymous()
            .DisableRateLimiting()
            .WithTags(Resources.Lesson)
            .WithName("GetHlsFile");
    }

    // ────────────────────────────────────────────────────────────────────────────

    private static async Task<IResult> Upload(
        Guid courseId,
        Guid lessonId,
        IFormFile? file,
        [FromServices] UploadVideoHandler handler,
        ClaimsPrincipal user,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return Results.BadRequest("No file provided.");

        var instructorId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (instructorId is null)
            return Results.Unauthorized();

        await using var stream = file.OpenReadStream();
        var cmd = new UploadVideoCommand(courseId, lessonId, instructorId, stream, file.FileName, file.Length);

        var result = await handler.Handle(cmd, ct);
        return result.IsSuccess
            ? Results.Accepted($"/api/video-jobs/{result.Value!.JobId}", result.Value)
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> GetJobStatus(
        Guid jobId,
        [FromServices] GetVideoJobStatusHandler handler,
        CancellationToken ct)
    {
        var result = await handler.Handle(new GetVideoJobStatusQuery(jobId), ct);
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> GetJobByLesson(
        Guid lessonId,
        [FromServices] GetVideoJobByLessonHandler handler,
        CancellationToken ct)
    {
        var result = await handler.Handle(new GetVideoJobByLessonQuery(lessonId), ct);
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> GetManifest(
        Guid lessonId,
        HttpContext httpContext,
        IOptions<StorageOptions> storageOpts,
        IVideoAssetRepository assets,
        IDbConnectionFactory dbFactory,
        ISubscriptionRepository subscriptionRepo,
        IEnrollmentRepository enrollmentRepo,
        IMemoryCache cache,
        CancellationToken ct)
    {
        var info = await GetLessonAccessInfo(lessonId, dbFactory, cache, ct);
        if (info is null)
            return Results.NotFound("Lesson not found.");

        if (!await CheckVideoAccess(info, httpContext.User, subscriptionRepo, enrollmentRepo, ct))
            return httpContext.User.Identity?.IsAuthenticated == true
                ? Results.Forbid()
                : Results.Unauthorized();

        var asset = await assets.GetByLessonIdAsync(lessonId, ct);
        if (asset is null)
            return Results.NotFound("Video not yet processed.");

        var fullPath = Path.Combine(storageOpts.Value.RootPath, asset.HlsManifestPath);
        if (!File.Exists(fullPath))
            return Results.NotFound("Manifest file missing.");

        var content = await File.ReadAllTextAsync(fullPath, ct);
        // Prepend "hls/" to sub-playlist URI lines so hls.js resolves them to /api/lessons/{id}/video/hls/...
        // hls.js strips the last path segment of the manifest URL, giving base /api/lessons/{id}/video/.
        // So "hls/360/stream.m3u8" resolves correctly to /api/lessons/{id}/video/hls/360/stream.m3u8.
        content = RewriteManifestUris(content);

        return Results.Content(content, "application/vnd.apple.mpegurl");
    }

    private static async Task<IResult> GetHlsFile(
        Guid lessonId,
        string filePath,
        HttpContext httpContext,
        IOptions<StorageOptions> storageOpts,
        IDbConnectionFactory dbFactory,
        ISubscriptionRepository subscriptionRepo,
        IEnrollmentRepository enrollmentRepo,
        IMemoryCache cache,
        CancellationToken ct)
    {
        if (filePath.Contains(".."))
            return Results.BadRequest();

        var info = await GetLessonAccessInfo(lessonId, dbFactory, cache, ct);
        if (info is null)
            return Results.NotFound();

        if (!await CheckVideoAccess(info, httpContext.User, subscriptionRepo, enrollmentRepo, ct))
            return httpContext.User.Identity?.IsAuthenticated == true
                ? Results.Forbid()
                : Results.Unauthorized();

        var root = storageOpts.Value.RootPath;
        var fullPath = Path.Combine(root, "videos", lessonId.ToString(), "hls",
            filePath.Replace('/', Path.DirectorySeparatorChar));

        var expectedBase = Path.GetFullPath(Path.Combine(root, "videos", lessonId.ToString(), "hls"));
        var resolvedPath = Path.GetFullPath(fullPath);
        if (!resolvedPath.StartsWith(expectedBase, StringComparison.OrdinalIgnoreCase))
            return Results.BadRequest();

        if (!File.Exists(resolvedPath))
            return Results.NotFound();

        var contentType = Path.GetExtension(resolvedPath) switch
        {
            ".m3u8" => "application/vnd.apple.mpegurl",
            ".ts"   => "video/mp2t",
            _       => "application/octet-stream"
        };

        return Results.File(resolvedPath, contentType);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private sealed class LessonAccessRow
    {
        public bool IsFreePreview { get; init; }
        public bool IsFree { get; init; }
        public Guid CourseId { get; init; }
    }

    private sealed record LessonAccessInfo(bool IsFreePreview, bool IsFree, Guid CourseId);

    private static async Task<LessonAccessInfo?> GetLessonAccessInfo(
        Guid lessonId,
        IDbConnectionFactory dbFactory,
        IMemoryCache cache,
        CancellationToken ct)
    {
        var cacheKey = $"video:access:{lessonId}";
        if (cache.TryGetValue(cacheKey, out LessonAccessInfo? cached))
            return cached;

        using var conn = dbFactory.Create();
        var row = await conn.QueryFirstOrDefaultAsync<LessonAccessRow>(
            """
            SELECT l."IsFreePreview" AS IsFreePreview,
                   c."IsFree"        AS IsFree,
                   c."Id"            AS CourseId
            FROM "Lessons" l
            JOIN "Modules" m ON m."Id" = l."ModuleId"
            JOIN "Courses" c ON c."Id" = m."CourseId"
            WHERE l."Id" = @lessonId
            """,
            new { lessonId });

        var info = row is null ? null
            : new LessonAccessInfo(row.IsFreePreview, row.IsFree, row.CourseId);

        cache.Set(cacheKey, info, TimeSpan.FromMinutes(5));
        return info;
    }

    private static async Task<bool> CheckVideoAccess(
        LessonAccessInfo info,
        ClaimsPrincipal user,
        ISubscriptionRepository subscriptionRepo,
        IEnrollmentRepository enrollmentRepo,
        CancellationToken ct)
    {
        if (info.IsFreePreview) return true;

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return false;

        if (user.IsInRole("Admin") || user.IsInRole("Instructor")) return true;

        var sub = await subscriptionRepo.GetActiveByUserAsync(userId, ct);
        if (sub?.GrantsAccess() == true) return true;

        if (info.IsFree)
            return await enrollmentRepo.ExistsAsync(userId, info.CourseId, ct);

        return false;
    }

    private static string RewriteManifestUris(string content)
    {
        var lines = content.Split('\n');
        return string.Join('\n', lines.Select(line =>
        {
            var trimmed = line.TrimEnd('\r');
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#'))
                return line;
            return "hls/" + trimmed;
        }));
    }
}
