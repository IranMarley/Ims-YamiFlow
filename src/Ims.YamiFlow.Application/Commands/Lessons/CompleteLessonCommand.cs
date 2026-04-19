
namespace Ims.YamiFlow.Application.Commands.Lessons;

// ── Command ───────────────────────────────────────────
public record CompleteLessonCommand(
    Guid EnrollmentId,
    Guid LessonId,
    string StudentId
);

// ── Response ──────────────────────────────────────────
public record CompleteLessonResponse(decimal ProgressPercent, bool CourseComplete);

// ── Handler ───────────────────────────────────────────
public class CompleteLessonHandler(
    IEnrollmentRepository enrollments,
    ICourseRepository courses,
    ICertificateRepository certificates,
    IUnitOfWork uow)
    : IHandler<CompleteLessonCommand, Result<CompleteLessonResponse>>
{
    public async Task<Result<CompleteLessonResponse>> Handle(CompleteLessonCommand cmd, CancellationToken ct)
    {
        var enrollment = await enrollments.GetByIdAsync(cmd.EnrollmentId, ct);
        if (enrollment is null)
            return Result.Failure<CompleteLessonResponse>("Enrollment not found.");

        if (enrollment.StudentId != cmd.StudentId)
            return Result.Failure<CompleteLessonResponse>("Access denied.");

        enrollment.CompleteLesson(cmd.LessonId);

        var course = await courses.GetByIdWithModulesAsync(enrollment.CourseId, ct);
        var totalLessons = course?.Modules.SelectMany(m => m.Lessons).Count() ?? 0;
        var progress = enrollment.CalculateProgress(totalLessons);
        var isComplete = enrollment.IsEligibleForCertificate(totalLessons);

        if (isComplete && enrollment.Status == EnrollmentStatus.Active)
        {
            enrollment.Complete();

            // Auto-issue certificate if not already present
            var existing = await certificates.GetByEnrollmentIdAsync(enrollment.Id, ct);
            if (existing is null)
            {
                var cert = Certificate.Create(enrollment.Id, enrollment.StudentId, enrollment.CourseId);
                await certificates.AddAsync(cert, ct);
            }
        }

        enrollments.Update(enrollment);
        await uow.CommitAsync(ct);

        return Result.Success(new CompleteLessonResponse(progress, isComplete));
    }
}
