using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Reviews;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Reviews;

namespace Ims.YamiFlow.API.Endpoints;

public static class ReviewEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/courses/{courseId:guid}/reviews").WithTags(Resources.Review);

        group.MapGet("/", async (Guid courseId, int page, int pageSize, ListCourseReviewsHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new ListCourseReviewsQuery(courseId, page, pageSize), ct)))
        .AllowAnonymous()
        .WithName("ListCourseReviews");

        group.MapPost("/", async (
            Guid courseId,
            CreateReviewRequest req,
            CreateReviewHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var studentId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(
                new CreateReviewCommand(courseId, studentId, req.Rating, req.Comment), ct);
            return result.IsSuccess
                ? Results.Created($"/api/courses/{courseId}/reviews/{result.Value!.ReviewId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Review, Operations.Create))
        .WithName("CreateReview");

        group.MapPut("/{reviewId:guid}", async (
            Guid courseId,
            Guid reviewId,
            UpdateReviewRequest req,
            UpdateReviewHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var studentId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(
                new UpdateReviewCommand(reviewId, studentId, req.Rating, req.Comment), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Review, Operations.Update))
        .WithName("UpdateReview");

        group.MapDelete("/{reviewId:guid}", async (
            Guid courseId,
            Guid reviewId,
            DeleteReviewHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var studentId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new DeleteReviewCommand(reviewId, studentId), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Review, Operations.Delete))
        .WithName("DeleteReview");
    }
}

public record CreateReviewRequest(int Rating, string Comment);
public record UpdateReviewRequest(int Rating, string Comment);
