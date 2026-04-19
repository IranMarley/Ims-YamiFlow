using FluentValidation;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Quizzes;

// ── Responses ─────────────────────────────────────────
public record QuizResponse(Guid QuizId, Guid LessonId, string Title);

public record QuestionResponse(Guid QuestionId, Guid QuizId, string Text, string[] Options, int CorrectIndex);

public record QuizResultResponse(
    Guid QuizId,
    string StudentId,
    int Score,
    int TotalQuestions,
    bool Passed
);

// ── CreateQuizCommand ─────────────────────────────────
public record CreateQuizCommand(Guid LessonId, string Title) : IRequest<Result<QuizResponse>>;

public class CreateQuizValidator : AbstractValidator<CreateQuizCommand>
{
    public CreateQuizValidator()
    {
        RuleFor(x => x.LessonId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class CreateQuizHandler : IRequestHandler<CreateQuizCommand, Result<QuizResponse>>
{
    public Task<Result<QuizResponse>> Handle(CreateQuizCommand cmd, CancellationToken ct)
    {
        // TODO: Persist quiz to database
        var response = new QuizResponse(Guid.NewGuid(), cmd.LessonId, cmd.Title);
        return Task.FromResult(Result.Success(response));
    }
}

// ── DeleteQuizCommand ─────────────────────────────────
public record DeleteQuizCommand(Guid QuizId, string InstructorId) : IRequest<Result>;

public class DeleteQuizValidator : AbstractValidator<DeleteQuizCommand>
{
    public DeleteQuizValidator()
    {
        RuleFor(x => x.QuizId).NotEmpty();
        RuleFor(x => x.InstructorId).NotEmpty();
    }
}

public class DeleteQuizHandler : IRequestHandler<DeleteQuizCommand, Result>
{
    public Task<Result> Handle(DeleteQuizCommand cmd, CancellationToken ct)
    {
        // TODO: Find quiz, verify ownership, delete
        return Task.FromResult(Result.Success());
    }
}

// ── AddQuestionCommand ────────────────────────────────
public record AddQuestionCommand(
    Guid QuizId,
    string Text,
    string[] Options,
    int CorrectIndex
) : IRequest<Result<QuestionResponse>>;

public class AddQuestionValidator : AbstractValidator<AddQuestionCommand>
{
    public AddQuestionValidator()
    {
        RuleFor(x => x.QuizId).NotEmpty();
        RuleFor(x => x.Text).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Options).NotEmpty().Must(o => o.Length >= 2).WithMessage("At least 2 options required.");
        RuleFor(x => x.CorrectIndex).GreaterThanOrEqualTo(0);
    }
}

public class AddQuestionHandler : IRequestHandler<AddQuestionCommand, Result<QuestionResponse>>
{
    public Task<Result<QuestionResponse>> Handle(AddQuestionCommand cmd, CancellationToken ct)
    {
        // TODO: Persist question to database
        var response = new QuestionResponse(
            Guid.NewGuid(),
            cmd.QuizId,
            cmd.Text,
            cmd.Options,
            cmd.CorrectIndex
        );
        return Task.FromResult(Result.Success(response));
    }
}

// ── SubmitQuizCommand ─────────────────────────────────
public record SubmitQuizCommand(
    Guid QuizId,
    string StudentId,
    int[] Answers
) : IRequest<Result<QuizResultResponse>>;

public class SubmitQuizValidator : AbstractValidator<SubmitQuizCommand>
{
    public SubmitQuizValidator()
    {
        RuleFor(x => x.QuizId).NotEmpty();
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.Answers).NotEmpty();
    }
}

public class SubmitQuizHandler : IRequestHandler<SubmitQuizCommand, Result<QuizResultResponse>>
{
    public Task<Result<QuizResultResponse>> Handle(SubmitQuizCommand cmd, CancellationToken ct)
    {
        // TODO: Grade quiz against correct answers from database
        var response = new QuizResultResponse(
            cmd.QuizId,
            cmd.StudentId,
            Score: 0,
            TotalQuestions: cmd.Answers.Length,
            Passed: false
        );
        return Task.FromResult(Result.Success(response));
    }
}
