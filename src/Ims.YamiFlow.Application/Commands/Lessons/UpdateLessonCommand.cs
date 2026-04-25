using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Lessons;

public record UpdateLessonCommand(
    Guid CourseId,
    Guid ModuleId,
    Guid LessonId,
    string InstructorId,
    string Title,
    LessonType Type,
    int DurationSeconds,
    string? ContentUrl,
    bool IsFreePreview
);

public class UpdateLessonValidator : AbstractValidator<UpdateLessonCommand>
{
    public UpdateLessonValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DurationSeconds).GreaterThanOrEqualTo(0);
    }
}

public class UpdateLessonHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<UpdateLessonCommand, Result>
{
    public async Task<Result> Handle(UpdateLessonCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null) return Result.Failure("Course not found.");
        if (course.InstructorId != cmd.InstructorId) return Result.Failure("Access denied.");

        var module = course.FindModule(cmd.ModuleId);
        if (module is null) return Result.Failure("Module not found.");

        var lesson = module.FindLesson(cmd.LessonId);
        if (lesson is null) return Result.Failure("Lesson not found.");

        lesson.Update(cmd.Title, cmd.Type, cmd.DurationSeconds, cmd.ContentUrl, cmd.IsFreePreview);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
