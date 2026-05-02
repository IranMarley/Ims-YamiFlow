using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Courses;

// ── Command ───────────────────────────────────────────
public record UpdateCourseCommand(
    Guid CourseId,
    string InstructorId,
    string Title,
    string Description,
    CourseLevel Level,
    bool IsFree = false
);

// ── Validator ─────────────────────────────────────────
public class UpdateCourseValidator : AbstractValidator<UpdateCourseCommand>
{
    public UpdateCourseValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
    }
}

// ── Handler ───────────────────────────────────────────
public class UpdateCourseHandler(ICourseRepository courses, IUnitOfWork uow, ICacheService cache)
    : IHandler<UpdateCourseCommand, Result>
{
    public async Task<Result> Handle(UpdateCourseCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        course.Update(cmd.Title, cmd.Description, cmd.Level, cmd.IsFree);
        await uow.CommitAsync(ct);

        await cache.RemoveAsync(CacheKeys.CourseDetail(cmd.CourseId), ct);
        await cache.RemoveByPrefixAsync(CacheKeys.CourseListPrefix, ct);
        return Result.Success();
    }
}
