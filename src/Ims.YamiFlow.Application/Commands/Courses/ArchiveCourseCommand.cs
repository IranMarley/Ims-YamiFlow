
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Courses;

public record ArchiveCourseCommand(Guid CourseId, string InstructorId);

public class ArchiveCourseHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<ArchiveCourseCommand, Result>
{
    public async Task<Result> Handle(ArchiveCourseCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        course.Archive();
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
