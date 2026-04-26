using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Lessons;
using Ims.YamiFlow.Application.IAM.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints;

public static class LessonEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        // ── CRUD: nested under courses/modules ────────
        var crud = app
            .MapGroup("/api/courses/{courseId:guid}/modules/{moduleId:guid}/lessons")
            .WithTags(Resources.Lesson);

        crud.MapPost("/", async (
            Guid courseId, Guid moduleId, [FromBody] AddLessonRequest req,
            AddLessonHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new AddLessonCommand(
                courseId, moduleId, user.FindFirstValue(ClaimTypes.NameIdentifier)!,
                req.Title, req.Order, req.ContentUrl, req.IsFreePreview), ct);
            return result.IsSuccess
                ? Results.Created($"/api/lessons/{result.Value!.LessonId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Create))
        .WithName("AddLesson");

        crud.MapPut("/{lessonId:guid}", async (
            Guid courseId, Guid moduleId, Guid lessonId, [FromBody] UpdateLessonRequest req,
            UpdateLessonHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new UpdateLessonCommand(
                courseId, moduleId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!,
                req.Title, req.ContentUrl, req.IsFreePreview), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Update))
        .WithName("UpdateLesson");

        crud.MapDelete("/{lessonId:guid}", async (
            Guid courseId, Guid moduleId, Guid lessonId,
            DeleteLessonHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new DeleteLessonCommand(
                courseId, moduleId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Delete))
        .WithName("DeleteLesson");

        crud.MapPut("/{lessonId:guid}/move", async (
            Guid courseId, Guid moduleId, Guid lessonId, [FromBody] MoveLessonRequest req,
            MoveLessonHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new MoveLessonCommand(
                courseId, lessonId, req.TargetModuleId, req.NewOrder,
                user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Update))
        .WithName("MoveLesson");

        crud.MapPut("/reorder", async (
            Guid courseId, Guid moduleId, [FromBody] ReorderLessonsRequest req,
            ReorderLessonsHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var items = req.Items.Select(i => new LessonOrderItem(i.LessonId, i.Order)).ToList();
            var result = await handler.Handle(new ReorderLessonsCommand(
                courseId, moduleId, user.FindFirstValue(ClaimTypes.NameIdentifier)!, items), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Update))
        .WithName("ReorderLessons");

        // ── Progress: nested under enrollments ────────
        var progress = app
            .MapGroup("/api/enrollments/{enrollmentId:guid}/lessons/{lessonId:guid}")
            .WithTags(Resources.Lesson);

        progress.MapPost("/complete", async (
            Guid enrollmentId, Guid lessonId,
            CompleteLessonHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new CompleteLessonCommand(
                enrollmentId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Read))
        .WithName("CompleteLesson");

        progress.MapPost("/progress", async (
            Guid enrollmentId, Guid lessonId, [FromBody] SaveProgressRequest req,
            SaveProgressHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new SaveProgressCommand(
                enrollmentId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!, req.WatchedSeconds), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Read))
        .WithName("SaveProgress");
    }
}

// ── Request records ───────────────────────────────────
public record AddLessonRequest(string Title, int Order, string? ContentUrl, bool IsFreePreview);
public record UpdateLessonRequest(string Title, string? ContentUrl, bool IsFreePreview);
public record SaveProgressRequest(int WatchedSeconds);
public record ReorderLessonItem(Guid LessonId, int Order);
public record ReorderLessonsRequest(IReadOnlyList<ReorderLessonItem> Items);
public record MoveLessonRequest(Guid TargetModuleId, int NewOrder);
