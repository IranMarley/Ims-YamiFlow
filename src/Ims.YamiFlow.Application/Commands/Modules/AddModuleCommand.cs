using FluentValidation;

namespace Ims.YamiFlow.Application.Commands.Modules;

// ── Command ───────────────────────────────────────────
public record AddModuleCommand(
    Guid CourseId,
    string InstructorId,
    string Title,
    int Order
);

// ── Response ──────────────────────────────────────────
public record AddModuleResponse(Guid ModuleId, string Title, int Order);

// ── Validator ─────────────────────────────────────────
public class AddModuleValidator : AbstractValidator<AddModuleCommand>
{
    public AddModuleValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Order).GreaterThan(0);
    }
}

// ── Handler ───────────────────────────────────────────
public class AddModuleHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<AddModuleCommand, Result<AddModuleResponse>>
{
    public async Task<Result<AddModuleResponse>> Handle(AddModuleCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure<AddModuleResponse>("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure<AddModuleResponse>("Access denied.");

        course.AddModule(cmd.Title, cmd.Order);
        courses.Update(course);
        await uow.CommitAsync(ct);

        var module = course.Modules.Last();
        return Result.Success(new AddModuleResponse(module.Id, module.Title, module.Order));
    }
}
