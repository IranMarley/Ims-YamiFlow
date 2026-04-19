using FluentValidation;

namespace Ims.YamiFlow.Application.Commands.Lessons;

// ── Command ───────────────────────────────────────────
public record AddLessonCommand(
    Guid CourseId,
    Guid ModuleId,
    string InstructorId,
    string Title,
    LessonType Type,
    int DurationSeconds,
    int Order,
    string? ContentUrl,
    bool IsFreePreview
);

// ── Response ──────────────────────────────────────────
public record AddLessonResponse(Guid LessonId, string Title, int Order);

// ── Validator ─────────────────────────────────────────
public class AddLessonValidator : AbstractValidator<AddLessonCommand>
{
    public AddLessonValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DurationSeconds).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Order).GreaterThan(0);
    }
}

// ── Handler ───────────────────────────────────────────
public class AddLessonHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<AddLessonCommand, Result<AddLessonResponse>>
{
    public async Task<Result<AddLessonResponse>> Handle(AddLessonCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure<AddLessonResponse>("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure<AddLessonResponse>("Access denied.");

        var module = course.FindModule(cmd.ModuleId);
        if (module is null)
            return Result.Failure<AddLessonResponse>("Module not found.");

        module.AddLesson(cmd.Title, cmd.Type, cmd.DurationSeconds, cmd.Order, cmd.ContentUrl);

        var lesson = module.Lessons.Last();
        if (cmd.IsFreePreview) lesson.MakeFreePreview();

        courses.Update(course);
        await uow.CommitAsync(ct);

        return Result.Success(new AddLessonResponse(lesson.Id, lesson.Title, lesson.Order));
    }
}
