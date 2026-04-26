using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Courses;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Courses;
using Ims.YamiFlow.Domain.Enums;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Services.Media;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace Ims.YamiFlow.API.Endpoints;

public static class CourseEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/courses").WithTags(Resources.Course).RequireRateLimiting("default");

        group.MapPost("/", async (CreateCourseRequest req, CreateCourseHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new CreateCourseCommand(
                user.FindFirstValue(ClaimTypes.NameIdentifier)!, req.Title, req.Description, req.Level, req.IsFree), ct);
            return result.IsSuccess
                ? Results.Created($"/api/courses/{result.Value!.CourseId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Create))
        .WithName("CreateCourse");

        group.MapGet("/", async ([AsParameters] ListCoursesParams p, ListCoursesHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new ListCoursesQuery(p.Search, p.Level, p.IsFree, p.Page, p.PageSize), ct)))
        .AllowAnonymous()
        .WithName("ListCourses");

        group.MapGet("/{courseId:guid}", async (Guid courseId, GetCourseDetailHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetCourseDetailQuery(courseId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        })
        .AllowAnonymous()
        .WithName("GetCourse");

        group.MapPut("/{courseId:guid}", async (
            Guid courseId, [FromBody] UpdateCourseRequest req,
            UpdateCourseHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new UpdateCourseCommand(
                courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!,
                req.Title, req.Description, req.Level, req.IsFree), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("UpdateCourse");

        group.MapPost("/{courseId:guid}/publish", async (
            Guid courseId, PublishCourseHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(
                new PublishCourseCommand(courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("PublishCourse");

        group.MapPost("/{courseId:guid}/archive", async (
            Guid courseId, ArchiveCourseHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(
                new ArchiveCourseCommand(courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("ArchiveCourse");

        group.MapPost("/{courseId:guid}/thumbnail", async (
            Guid courseId,
            IFormFile? file,
            ICourseRepository courseRepo,
            IUnitOfWork uow,
            IOptions<StorageOptions> storageOpts,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            if (file is null || file.Length == 0)
                return Results.BadRequest("No file provided.");

            var instructorId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var course = await courseRepo.GetByIdAsync(courseId, ct);
            if (course is null) return Results.NotFound();
            if (course.InstructorId != instructorId) return Results.Forbid();

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp"))
                return Results.BadRequest("Unsupported image format.");

            var dir = Path.Combine(storageOpts.Value.RootPath, "courses", courseId.ToString());
            Directory.CreateDirectory(dir);

            // Remove any existing thumbnail regardless of extension
            foreach (var old in Directory.GetFiles(dir, "thumbnail.*"))
                File.Delete(old);

            // Always save as JPEG after resizing to max 1280×720, preserving aspect ratio
            var filePath = Path.Combine(dir, "thumbnail.jpg");
            await using var inputStream = file.OpenReadStream();
            using var image = await Image.LoadAsync(inputStream, ct);
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(1280, 720),
                Mode = ResizeMode.Max,
            }));
            await image.SaveAsync(filePath, new JpegEncoder { Quality = 85 }, ct);

            course.SetThumbnail($"/api/courses/{courseId}/thumbnail");
            await uow.CommitAsync(ct);

            return Results.Ok(new { thumbnailUrl = $"/api/courses/{courseId}/thumbnail" });
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .DisableAntiforgery()
        .WithName("UploadCourseThumbnail");

        group.MapGet("/{courseId:guid}/thumbnail", (
            Guid courseId,
            IOptions<StorageOptions> storageOpts) =>
        {
            var path = Path.Combine(storageOpts.Value.RootPath, "courses", courseId.ToString(), "thumbnail.jpg");
            return File.Exists(path) ? Results.File(path, "image/jpeg") : Results.NotFound();
        })
        .AllowAnonymous()
        .WithName("GetCourseThumbnail");
    }
}

// ── Request / param records ───────────────────────────
public record CreateCourseRequest(string Title, string Description, CourseLevel Level, bool IsFree = false);
public record UpdateCourseRequest(string Title, string Description, CourseLevel Level, bool IsFree = false);
public record ListCoursesParams(string? Search, CourseLevel? Level, bool? IsFree, int Page = 1, int PageSize = 12);
