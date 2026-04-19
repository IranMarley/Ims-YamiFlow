using FluentValidation;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Courses;

// ── Command ───────────────────────────────────────────
public record CreateCourseCommand(
    string InstructorId,
    string Title,
    string Description,
    decimal Price,
    CourseLevel Level
) : IRequest<Result<CreateCourseResponse>>;

// ── Response ──────────────────────────────────────────
public record CreateCourseResponse(Guid CourseId, string Title, string Slug);

// ── Validator ─────────────────────────────────────────
public class CreateCourseValidator : AbstractValidator<CreateCourseCommand>
{
    public CreateCourseValidator()
    {
        RuleFor(x => x.InstructorId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).WithMessage("Price cannot be negative.");
    }
}

// ── Handler ───────────────────────────────────────────
public class CreateCourseHandler(ICourseRepository courses, IUnitOfWork uow)
    : IRequestHandler<CreateCourseCommand, Result<CreateCourseResponse>>
{
    public async Task<Result<CreateCourseResponse>> Handle(CreateCourseCommand cmd, CancellationToken ct)
    {
        var course = Course.Create(cmd.Title, cmd.Description, cmd.Price, cmd.Level, cmd.InstructorId);
        await courses.AddAsync(course, ct);
        await uow.CommitAsync(ct);

        return Result.Success(new CreateCourseResponse(course.Id, course.Title, course.Slug));
    }
}
