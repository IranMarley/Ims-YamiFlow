using FluentValidation;

namespace Ims.YamiFlow.Application.Commands.Modules;

public record UpdateModuleCommand(
    Guid CourseId,
    Guid ModuleId,
    string InstructorId,
    string Title
);

public class UpdateModuleValidator : AbstractValidator<UpdateModuleCommand>
{
    public UpdateModuleValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class UpdateModuleHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<UpdateModuleCommand, Result>
{
    public async Task<Result> Handle(UpdateModuleCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        var module = course.FindModule(cmd.ModuleId);
        if (module is null)
            return Result.Failure("Module not found.");

        module.UpdateTitle(cmd.Title);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
