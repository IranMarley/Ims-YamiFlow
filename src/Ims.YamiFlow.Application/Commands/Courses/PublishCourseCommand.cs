
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Courses;

public record PublishCourseCommand(Guid CourseId, string InstructorId);

public class PublishCourseHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<PublishCourseCommand, Result>
{
    public async Task<Result> Handle(PublishCourseCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        course.Publish();
        courses.Update(course);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
