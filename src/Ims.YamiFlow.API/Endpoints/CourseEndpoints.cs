using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Courses;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Courses;
using Ims.YamiFlow.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class CourseEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/courses").WithTags(Resources.Course).RequireRateLimiting("default");

        group.MapPost("/", async (CreateCourseRequest req, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new CreateCourseCommand(
                user.FindFirstValue(ClaimTypes.NameIdentifier)!, req.Title, req.Description, req.Price, req.Level), ct);
            return result.IsSuccess
                ? Results.Created($"/api/courses/{result.Value!.CourseId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Create))
        .WithName("CreateCourse");

        group.MapGet("/", async ([AsParameters] ListCoursesParams p, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new ListCoursesQuery(p.Search, p.Level, p.Page, p.PageSize), ct)))
        .AllowAnonymous()
        .WithName("ListCourses");

        group.MapGet("/{courseId:guid}", async (Guid courseId, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetCourseDetailQuery(courseId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        })
        .AllowAnonymous()
        .WithName("GetCourse");

        group.MapPut("/{courseId:guid}", async (
            Guid courseId, [FromBody] UpdateCourseRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new UpdateCourseCommand(
                courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!,
                req.Title, req.Description, req.Price, req.Level), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("UpdateCourse");

        group.MapPost("/{courseId:guid}/publish", async (
            Guid courseId, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(
                new PublishCourseCommand(courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("PublishCourse");

        group.MapPost("/{courseId:guid}/archive", async (
            Guid courseId, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(
                new ArchiveCourseCommand(courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("ArchiveCourse");

        group.MapPut("/{courseId:guid}/promotion", async (
            Guid courseId, [FromBody] SetPromotionRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new SetPromotionCommand(
                courseId,
                user.FindFirstValue(ClaimTypes.NameIdentifier)!,
                req.PromotionalPrice,
                req.ExpiresAt), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("SetPromotion");
    }
}

// ── Request / param records ───────────────────────────
public record CreateCourseRequest(string Title, string Description, decimal Price, CourseLevel Level);
public record UpdateCourseRequest(string Title, string Description, decimal Price, CourseLevel Level);
public record SetPromotionRequest(decimal? PromotionalPrice, DateTime? ExpiresAt);
public record ListCoursesParams(string? Search, CourseLevel? Level, int Page = 1, int PageSize = 12);
