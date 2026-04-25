
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Lessons;

public record DeleteLessonCommand(
    Guid CourseId,
    Guid ModuleId,
    Guid LessonId,
    string InstructorId
);

public class DeleteLessonHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<DeleteLessonCommand, Result>
{
    public async Task<Result> Handle(DeleteLessonCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null) return Result.Failure("Course not found.");
        if (course.InstructorId != cmd.InstructorId) return Result.Failure("Access denied.");

        var module = course.FindModule(cmd.ModuleId);
        if (module is null) return Result.Failure("Module not found.");

        var lesson = module.FindLesson(cmd.LessonId);
        if (lesson is null) return Result.Failure("Lesson not found.");

        courses.RemoveLesson(lesson);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
