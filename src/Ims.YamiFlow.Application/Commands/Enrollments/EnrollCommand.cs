using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;

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
// Free courses can be enrolled directly. Premium courses require an active subscription.
public class EnrollHandler(
    ICourseRepository courseRepository,
    IEnrollmentRepository enrollmentRepository,
    ISubscriptionRepository subscriptionRepository,
    IAuthUserService userService,
    IUnitOfWork uow,
    ICacheService cache)
    : IHandler<EnrollCommand, Result<EnrollResponse>>
{
    public async Task<Result<EnrollResponse>> Handle(EnrollCommand cmd, CancellationToken ct)
    {
        var roles = await userService.GetRolesAsync(cmd.StudentId, ct);
        if (roles.Contains("Instructor") || roles.Contains("Admin"))
            return Result.Failure<EnrollResponse>("Only students can enroll in courses.");

        var course = await courseRepository.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure<EnrollResponse>("Course not found.");

        if (!course.IsPublished)
            return Result.Failure<EnrollResponse>("Course is not available.");

        if (!course.IsFree)
        {
            var sub = await subscriptionRepository.GetActiveByUserAsync(cmd.StudentId, ct);
            if (sub is null || !sub.GrantsAccess())
                return Result.Failure<EnrollResponse>("An active subscription is required to enroll in premium courses.");
        }

        var alreadyEnrolled = await enrollmentRepository
            .ExistsAsync(cmd.StudentId, cmd.CourseId, ct);
        if (alreadyEnrolled)
            return Result.Failure<EnrollResponse>("Student is already enrolled in this course.");

        var enrollment = Enrollment.Create(cmd.StudentId, cmd.CourseId);
        await enrollmentRepository.AddAsync(enrollment, ct);
        await uow.CommitAsync(ct);

        await cache.RemoveByPrefixAsync(CacheKeys.UserEnrollmentsPrefix(cmd.StudentId), ct);

        return Result.Success(new EnrollResponse(
            EnrollmentId: enrollment.Id,
            CourseTitle: course.Title,
            EnrolledAt: enrollment.EnrolledAt
        ));
    }
}
