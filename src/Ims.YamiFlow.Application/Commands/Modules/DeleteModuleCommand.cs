
namespace Ims.YamiFlow.Application.Commands.Modules;

public record DeleteModuleCommand(Guid CourseId, Guid ModuleId, string InstructorId);

public class DeleteModuleHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<DeleteModuleCommand, Result>
{
    public async Task<Result> Handle(DeleteModuleCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        var module = course.FindModule(cmd.ModuleId);
        if (module is null)
            return Result.Failure("Module not found.");

        courses.RemoveModule(module);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
