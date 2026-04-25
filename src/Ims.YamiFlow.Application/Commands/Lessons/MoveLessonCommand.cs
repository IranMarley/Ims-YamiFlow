using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Lessons;

public record MoveLessonCommand(
    Guid CourseId,
    Guid LessonId,
    Guid TargetModuleId,
    int NewOrder,
    string InstructorId
);

public class MoveLessonValidator : AbstractValidator<MoveLessonCommand>
{
    public MoveLessonValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.LessonId).NotEmpty();
        RuleFor(x => x.TargetModuleId).NotEmpty();
        RuleFor(x => x.NewOrder).GreaterThanOrEqualTo(1);
    }
}

public class MoveLessonHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<MoveLessonCommand, Result>
{
    public async Task<Result> Handle(MoveLessonCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null) return Result.Failure("Course not found.");
        if (course.InstructorId != cmd.InstructorId) return Result.Failure("Access denied.");

        var targetModule = course.FindModule(cmd.TargetModuleId);
        if (targetModule is null) return Result.Failure("Target module not found.");

        var lesson = course.Modules
            .SelectMany(m => m.Lessons)
            .FirstOrDefault(l => l.Id == cmd.LessonId);
        if (lesson is null) return Result.Failure("Lesson not found.");

        lesson.ChangeModule(cmd.TargetModuleId, cmd.NewOrder);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}
