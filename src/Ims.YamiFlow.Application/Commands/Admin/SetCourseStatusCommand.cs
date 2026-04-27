using FluentValidation;
using Ims.YamiFlow.Domain.Enums;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Admin;

// ── Command ───────────────────────────────────────────
public record SetCourseStatusCommand(Guid CourseId, CourseStatus Status);

// ── Validator ─────────────────────────────────────────
public class SetCourseStatusValidator : AbstractValidator<SetCourseStatusCommand>
{
    public SetCourseStatusValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}

// ── Handler ───────────────────────────────────────────
public class SetCourseStatusHandler(
    ICourseRepository courses,
    IUnitOfWork uow)
    : IHandler<SetCourseStatusCommand, Result>
{
    public async Task<Result> Handle(SetCourseStatusCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        course.AdminSetStatus(cmd.Status);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
