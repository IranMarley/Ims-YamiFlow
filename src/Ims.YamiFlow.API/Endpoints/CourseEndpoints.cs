using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Courses;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Courses;
using Ims.YamiFlow.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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
    }
}

// ── Request / param records ───────────────────────────
public record CreateCourseRequest(string Title, string Description, CourseLevel Level, bool IsFree = false);
public record UpdateCourseRequest(string Title, string Description, CourseLevel Level, bool IsFree = false);
public record ListCoursesParams(string? Search, CourseLevel? Level, bool? IsFree, int Page = 1, int PageSize = 12);
