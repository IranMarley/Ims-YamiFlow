using MediatR;

namespace Ims.YamiFlow.Application.Queries.Quizzes;

// ── Response ──────────────────────────────────────────
public record QuizQuestionItem(Guid QuestionId, string Text, string[] Options);

public record QuizDetail(
    Guid QuizId,
    Guid LessonId,
    string Title,
    IReadOnlyList<QuizQuestionItem> Questions
);

// ── Query ─────────────────────────────────────────────
public record GetQuizQuery(Guid QuizId) : IRequest<Result<QuizDetail>>;

// ── Handler ───────────────────────────────────────────
public class GetQuizHandler(IDbConnectionFactory db)
    : IRequestHandler<GetQuizQuery, Result<QuizDetail>>
{
    public Task<Result<QuizDetail>> Handle(GetQuizQuery q, CancellationToken ct)
    {
        // TODO: Query Quizzes + Questions tables via Dapper
        return Task.FromResult(Result.Failure<QuizDetail>("Quiz not found."));
    }
}
