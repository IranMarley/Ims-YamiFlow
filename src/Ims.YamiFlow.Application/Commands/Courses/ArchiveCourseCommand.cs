using MediatR;

namespace Ims.YamiFlow.Application.Commands.Courses;

public record ArchiveCourseCommand(Guid CourseId, string InstructorId) : IRequest<Result>;

public class ArchiveCourseHandler(ICourseRepository courses, IUnitOfWork uow)
    : IRequestHandler<ArchiveCourseCommand, Result>
{
    public async Task<Result> Handle(ArchiveCourseCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        course.Archive();
        courses.Update(course);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
