using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Modules;

public record ModuleOrderItem(Guid ModuleId, int Order);

public record ReorderModulesCommand(
    Guid CourseId,
    string InstructorId,
    IReadOnlyList<ModuleOrderItem> Items
);

public class ReorderModulesValidator : AbstractValidator<ReorderModulesCommand>
{
    public ReorderModulesValidator()
    {
        RuleFor(x => x.Items).NotEmpty().WithMessage("At least one item is required.");
    }
}

public class ReorderModulesHandler(ICourseRepository courses, IUnitOfWork uow)
    : IHandler<ReorderModulesCommand, Result>
{
    public async Task<Result> Handle(ReorderModulesCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("Access denied.");

        foreach (var item in cmd.Items)
        {
            var module = course.FindModule(item.ModuleId);
            module?.Reorder(item.Order);
        }

        await uow.CommitAsync(ct);
        return Result.Success();
    }
}
