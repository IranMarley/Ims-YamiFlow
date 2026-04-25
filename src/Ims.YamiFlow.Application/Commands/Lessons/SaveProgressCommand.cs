using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Lessons;

public record SaveProgressCommand(
    Guid EnrollmentId,
    Guid LessonId,
    string StudentId,
    int WatchedSeconds
);

public class SaveProgressValidator : AbstractValidator<SaveProgressCommand>
{
    public SaveProgressValidator()
    {
        RuleFor(x => x.WatchedSeconds).GreaterThanOrEqualTo(0);
    }
}

public class SaveProgressHandler(IEnrollmentRepository enrollments, IUnitOfWork uow)
    : IHandler<SaveProgressCommand, Result>
{
    public async Task<Result> Handle(SaveProgressCommand cmd, CancellationToken ct)
    {
        var enrollment = await enrollments.GetByIdAsync(cmd.EnrollmentId, ct);
        if (enrollment is null)
            return Result.Failure("Enrollment not found.");

        if (enrollment.StudentId != cmd.StudentId)
            return Result.Failure("Access denied.");

        enrollment.AddOrUpdateProgress(cmd.LessonId, cmd.WatchedSeconds);
        enrollments.Update(enrollment);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
