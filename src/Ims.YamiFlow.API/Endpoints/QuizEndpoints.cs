using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Quizzes;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Quizzes;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class QuizEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/quizzes").WithTags(Resources.Quiz);

        group.MapGet("/{quizId:guid}", async (Guid quizId, GetQuizHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetQuizQuery(quizId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Quiz, Operations.Read))
        .WithName("GetQuiz");

        group.MapPost("/", async (CreateQuizRequest req, CreateQuizHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new CreateQuizCommand(req.LessonId, req.Title), ct);
            return result.IsSuccess
                ? Results.Created($"/api/quizzes/{result.Value!.QuizId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Quiz, Operations.Create))
        .WithName("CreateQuiz");

        group.MapDelete("/{quizId:guid}", async (Guid quizId, DeleteQuizHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var instructorId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new DeleteQuizCommand(quizId, instructorId), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Quiz, Operations.Delete))
        .WithName("DeleteQuiz");

        group.MapPost("/{quizId:guid}/questions", async (
            Guid quizId,
            AddQuestionRequest req,
            AddQuestionHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(
                new AddQuestionCommand(quizId, req.Text, req.Options, req.CorrectIndex), ct);
            return result.IsSuccess
                ? Results.Created($"/api/quizzes/{quizId}/questions/{result.Value!.QuestionId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Quiz, Operations.Update))
        .WithName("AddQuizQuestion");

        group.MapPost("/{quizId:guid}/submit", async (
            Guid quizId,
            SubmitQuizRequest req,
            SubmitQuizHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var studentId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new SubmitQuizCommand(quizId, studentId, req.Answers), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("SubmitQuiz");
    }
}

public record CreateQuizRequest(Guid LessonId, string Title);
public record AddQuestionRequest(string Text, string[] Options, int CorrectIndex);
public record SubmitQuizRequest(int[] Answers);
