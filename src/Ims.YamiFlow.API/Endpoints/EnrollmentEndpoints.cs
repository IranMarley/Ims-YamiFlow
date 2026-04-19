using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Enrollments;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Enrollments;
using MediatR;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class EnrollmentEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/enrollments").WithTags(Resources.Enrollment);

        group.MapPost("/", async (
            EnrollRequest req, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new EnrollCommand(
                user.FindFirstValue(ClaimTypes.NameIdentifier)!, req.CourseId, req.CouponCode), ct);
            return result.IsSuccess
                ? Results.Created($"/api/enrollments/{result.Value!.EnrollmentId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x =>
        {
            x.RequireClaim(Resources.Enrollment, Operations.Create);
            x.AddRequirements(new Authorization.ActiveSubscriptionRequirement());
        })
        .WithName("Enroll");

        group.MapPost("/{enrollmentId:guid}/cancel", async (
            Guid enrollmentId, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new CancelEnrollmentCommand(
                enrollmentId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Enrollment, Operations.Update))
        .WithName("CancelEnrollment");

        group.MapGet("/my", async (
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct,
            int page = 1, int pageSize = 10) =>
        {
            var result = await mediator.Send(new GetMyEnrollmentsQuery(
                user.FindFirstValue(ClaimTypes.NameIdentifier)!, page, pageSize), ct);
            return Results.Ok(result);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Enrollment, Operations.Read))
        .WithName("GetMyEnrollments");

        group.MapGet("/{enrollmentId:guid}/progress", async (
            Guid enrollmentId, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetProgressQuery(
                enrollmentId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Enrollment, Operations.Read))
        .WithName("GetProgress");

        group.MapGet("/my/course-ids", async (IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var studentId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var ids = await mediator.Send(new GetMyCourseIdsQuery(studentId), ct);
            return Results.Ok(ids);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Enrollment, Operations.Read))
        .WithName("GetMyCourseIds");
    }
}

// ── Request records ───────────────────────────────────
public record EnrollRequest(Guid CourseId, string? CouponCode);
