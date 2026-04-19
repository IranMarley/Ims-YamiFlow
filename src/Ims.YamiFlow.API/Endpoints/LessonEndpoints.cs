using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Lessons;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Domain.Enums;
using MediatR;
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
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new AddLessonCommand(
                courseId, moduleId, user.FindFirstValue(ClaimTypes.NameIdentifier)!,
                req.Title, req.Type, req.DurationSeconds, req.Order, req.ContentUrl, req.IsFreePreview), ct);
            return result.IsSuccess
                ? Results.Created($"/api/lessons/{result.Value!.LessonId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Create))
        .WithName("AddLesson");

        crud.MapPut("/{lessonId:guid}", async (
            Guid courseId, Guid moduleId, Guid lessonId, [FromBody] UpdateLessonRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new UpdateLessonCommand(
                courseId, moduleId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!,
                req.Title, req.Type, req.DurationSeconds, req.ContentUrl, req.IsFreePreview), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Update))
        .WithName("UpdateLesson");

        crud.MapDelete("/{lessonId:guid}", async (
            Guid courseId, Guid moduleId, Guid lessonId,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new DeleteLessonCommand(
                courseId, moduleId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Lesson, Operations.Delete))
        .WithName("DeleteLesson");

        crud.MapPut("/reorder", async (
            Guid courseId, Guid moduleId, [FromBody] ReorderLessonsRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var items = req.Items.Select(i => new LessonOrderItem(i.LessonId, i.Order)).ToList();
            var result = await mediator.Send(new ReorderLessonsCommand(
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
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new CompleteLessonCommand(
                enrollmentId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x =>
        {
            x.RequireClaim(Resources.Lesson, Operations.Read);
            x.AddRequirements(new Authorization.ActiveSubscriptionRequirement());
        })
        .WithName("CompleteLesson");

        progress.MapPost("/progress", async (
            Guid enrollmentId, Guid lessonId, [FromBody] SaveProgressRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new SaveProgressCommand(
                enrollmentId, lessonId, user.FindFirstValue(ClaimTypes.NameIdentifier)!, req.WatchedSeconds), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x =>
        {
            x.RequireClaim(Resources.Lesson, Operations.Read);
            x.AddRequirements(new Authorization.ActiveSubscriptionRequirement());
        })
        .WithName("SaveProgress");
    }
}

// ── Request records ───────────────────────────────────
public record AddLessonRequest(
    string Title, LessonType Type, int DurationSeconds,
    int Order, string? ContentUrl, bool IsFreePreview);
public record UpdateLessonRequest(
    string Title, LessonType Type, int DurationSeconds,
    string? ContentUrl, bool IsFreePreview);
public record SaveProgressRequest(int WatchedSeconds);
public record ReorderLessonItem(Guid LessonId, int Order);
public record ReorderLessonsRequest(IReadOnlyList<ReorderLessonItem> Items);
