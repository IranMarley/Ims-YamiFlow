using MediatR;

namespace Ims.YamiFlow.Application.Commands.Enrollments;

public record CancelEnrollmentCommand(Guid EnrollmentId, string StudentId) : IRequest<Result>;

public class CancelEnrollmentHandler(IEnrollmentRepository enrollments, IUnitOfWork uow)
    : IRequestHandler<CancelEnrollmentCommand, Result>
{
    public async Task<Result> Handle(CancelEnrollmentCommand cmd, CancellationToken ct)
    {
        var enrollment = await enrollments.GetByIdAsync(cmd.EnrollmentId, ct);
        if (enrollment is null)
            return Result.Failure("Enrollment not found.");

        if (enrollment.StudentId != cmd.StudentId)
            return Result.Failure("Access denied.");

        enrollment.Cancel();
        enrollments.Update(enrollment);
        await uow.CommitAsync(ct);

        return Result.Success();
    }
}
