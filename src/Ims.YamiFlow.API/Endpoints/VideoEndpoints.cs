using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Videos;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Videos;

using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Services.Media;
using Microsoft.AspNetCore.Mvc;
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
            .Accepts<IFormFile>("multipart/form-data");

        // ── Job status ─────────────────────────────────────────────────────────
        app.MapGet("/api/video-jobs/{jobId:guid}", GetJobStatus)
            .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Read))
            .WithTags(Resources.Lesson)
            .WithName("GetVideoJobStatus");

        // ── Stream manifest ────────────────────────────────────────────────────
        app.MapGet("/api/lessons/{lessonId:guid}/video/manifest", GetManifest)
            .RequireAuthorization(Authorization.ActiveSubscriptionRequirement.PolicyName)
            .WithTags(Resources.Lesson)
            .WithName("GetVideoManifest");

        // ── HLS segments / sub-playlists ───────────────────────────────────────
        app.MapGet("/api/lessons/{lessonId:guid}/video/hls/{**filePath}", GetHlsFile)
            .RequireAuthorization(Authorization.ActiveSubscriptionRequirement.PolicyName)
            .WithTags(Resources.Lesson)
            .WithName("GetHlsFile");
    }

    // ────────────────────────────────────────────────────────────────────────────

    private static async Task<IResult> Upload(
        Guid courseId,
        Guid lessonId,
        IFormFile? file,
        [FromServices] IHandler<UploadVideoCommand, Result<UploadVideoResponse>> handler,
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
        [FromServices] IHandler<GetVideoJobStatusQuery, Result<VideoJobStatusResponse>> handler,
        CancellationToken ct)
    {
        var result = await handler.Handle(new GetVideoJobStatusQuery(jobId), ct);
        return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
    }

    private static async Task<IResult> GetManifest(
        Guid lessonId,
        IOptions<StorageOptions> storageOpts,
        IVideoAssetRepository assets,
        CancellationToken ct)
    {
        var asset = await assets.GetByLessonIdAsync(lessonId, ct);
        if (asset is null)
            return Results.NotFound("Video not yet processed.");

        var fullPath = Path.Combine(storageOpts.Value.RootPath, asset.HlsManifestPath);
        if (!File.Exists(fullPath))
            return Results.NotFound("Manifest file missing.");

        return Results.File(fullPath, "application/vnd.apple.mpegurl", "master.m3u8");
    }

    private static IResult GetHlsFile(
        Guid lessonId,
        string filePath,
        IOptions<StorageOptions> storageOpts)
    {
        // Prevent path traversal
        if (filePath.Contains(".."))
            return Results.BadRequest();

        var root     = storageOpts.Value.RootPath;
        var fullPath = Path.Combine(root, "videos", lessonId.ToString(), "hls",
            filePath.Replace('/', Path.DirectorySeparatorChar));

        // Ensure the resolved path stays within the expected directory
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
}
