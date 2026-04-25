using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Lessons;

public record LessonOrderItem(Guid LessonId, int Order);

public record ReorderLessonsCommand(
    Guid CourseId,
    Guid ModuleId,
    string InstructorId,
    IReadOnlyList<LessonOrderItem> Items
);

public class ReorderLessonsValidator : AbstractValidator<ReorderLessonsCommand>
{
    public ReorderLessonsValidator()
    {
        RuleFor(x => x.Items).NotEmpty();
    }
}

public class ReorderLessonsHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<ReorderLessonsCommand, Result>
{
    public async Task<Result> Handle(ReorderLessonsCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null) return Result.Failure("Course not found.");
        if (course.InstructorId != cmd.InstructorId) return Result.Failure("Access denied.");

        var module = course.FindModule(cmd.ModuleId);
        if (module is null) return Result.Failure("Module not found.");

        foreach (var item in cmd.Items)
        {
            var lesson = module.FindLesson(item.LessonId);
            lesson?.Reorder(item.Order);
        }

        await uow.CommitAsync(ct);
        return Result.Success();
    }
}
