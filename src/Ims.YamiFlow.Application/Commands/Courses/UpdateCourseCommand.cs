using FluentValidation;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Courses;

// ── Command ───────────────────────────────────────────
public record UpdateCourseCommand(
    Guid CourseId,
    string InstructorId,
    string Title,
    string Description,
    decimal Price,
    CourseLevel Level
) : IRequest<Result>;

// ── Validator ─────────────────────────────────────────
public class UpdateCourseValidator : AbstractValidator<UpdateCourseCommand>
{
    public UpdateCourseValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
    }
}

// ── Handler ───────────────────────────────────────────
public class UpdateCourseHandler(ICourseRepository courses, IUnitOfWork uow)
    : IRequestHandler<UpdateCourseCommand, Result>
{
    public async Task<Result> Handle(UpdateCourseCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        course.Update(cmd.Title, cmd.Description, cmd.Price, cmd.Level);
        courses.Update(course);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
