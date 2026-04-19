using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Forum;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Forum;

namespace Ims.YamiFlow.API.Endpoints;

public static class ForumEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/forum").WithTags(Resources.Forum);

        group.MapGet("/posts", async (Guid? courseId, int page, int pageSize, ListPostsHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new ListPostsQuery(courseId, page, pageSize), ct)))
        .RequireAuthorization()
        .WithName("ListPosts");

        group.MapGet("/posts/{postId:guid}", async (Guid postId, GetPostDetailHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetPostDetailQuery(postId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        })
        .RequireAuthorization()
        .WithName("GetPostDetail");

        group.MapPost("/posts", async (
            CreatePostRequest req,
            CreatePostHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var authorId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(
                new CreatePostCommand(authorId, req.CourseId, req.Title, req.Body), ct);
            return result.IsSuccess
                ? Results.Created($"/api/forum/posts/{result.Value!.PostId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Forum, Operations.Create))
        .WithName("CreatePost");

        group.MapPost("/posts/{postId:guid}/replies", async (
            Guid postId,
            ReplyRequest req,
            ReplyToPostHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var authorId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new ReplyToPostCommand(postId, authorId, req.Body), ct);
            return result.IsSuccess
                ? Results.Created($"/api/forum/posts/{postId}/replies/{result.Value!.ReplyId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Forum, Operations.Create))
        .WithName("ReplyToPost");

        group.MapDelete("/posts/{postId:guid}", async (
            Guid postId,
            DeletePostHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var authorId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new DeletePostCommand(postId, authorId), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Forum, Operations.Delete))
        .WithName("DeletePost");
    }
}

public record CreatePostRequest(Guid? CourseId, string Title, string Body);
public record ReplyRequest(string Body);
