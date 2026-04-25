using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Entities;

using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Enrollments;

// ── Command ──────────────────────────────────────────
// CouponCode is kept in the record for backwards compatibility with the API contract
// but is no longer applied — platform access is now gated by subscription, not per-course payment.
public record EnrollCommand(
    string StudentId,
    Guid CourseId,
    string? CouponCode
);

// ── Response ──────────────────────────────────────────
public record EnrollResponse(
    Guid EnrollmentId,
    string CourseTitle,
    DateTime EnrolledAt
);

// ── Validator ─────────────────────────────────────────
public class EnrollValidator : AbstractValidator<EnrollCommand>
{
    public EnrollValidator()
    {
        RuleFor(x => x.StudentId)
            .NotEmpty().WithMessage("Student is required");

        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("Course is required");

        RuleFor(x => x.CouponCode)
            .MaximumLength(50).WithMessage("Invalid coupon code")
            .When(x => x.CouponCode is not null);
    }
}

// ── Handler ───────────────────────────────────────────
// Access is gated at the HTTP layer via ActiveSubscriptionRequirement, so reaching
// this handler already implies the student has a valid subscription. Enrollment is
// now a tracking concern (progress, completion) — not a purchase. PricePaid is 0.
public class EnrollHandler(
    ICourseRepository courseRepository,
    IEnrollmentRepository enrollmentRepository,
    IUnitOfWork uow)
    : IHandler<EnrollCommand, Result<EnrollResponse>>
{
    public async Task<Result<EnrollResponse>> Handle(EnrollCommand cmd, CancellationToken ct)
    {
        var course = await courseRepository.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure<EnrollResponse>("Course not found.");

        if (!course.IsPublished)
            return Result.Failure<EnrollResponse>("Course is not available.");

        var alreadyEnrolled = await enrollmentRepository
            .ExistsAsync(cmd.StudentId, cmd.CourseId, ct);
        if (alreadyEnrolled)
            return Result.Failure<EnrollResponse>("Student is already enrolled in this course.");

        var enrollment = Enrollment.Create(cmd.StudentId, cmd.CourseId);
        await enrollmentRepository.AddAsync(enrollment, ct);
        await uow.CommitAsync(ct);

        return Result.Success(new EnrollResponse(
            EnrollmentId: enrollment.Id,
            CourseTitle: course.Title,
            EnrolledAt: enrollment.EnrolledAt
        ));
    }
}
