using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Courses;

public record SetPromotionCommand(
    Guid CourseId,
    string InstructorId,
    decimal? PromotionalPrice,
    DateTime? ExpiresAt
) : IRequest<Result>;

public class SetPromotionValidator : AbstractValidator<SetPromotionCommand>
{
    public SetPromotionValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.InstructorId).NotEmpty();
        When(x => x.PromotionalPrice.HasValue, () =>
        {
            RuleFor(x => x.PromotionalPrice).GreaterThanOrEqualTo(0);
            RuleFor(x => x.ExpiresAt).NotNull()
                .GreaterThan(DateTime.UtcNow).WithMessage("Promotion expiry must be in the future.");
        });
    }
}

public class SetPromotionHandler(ICourseRepository courseRepository, IUnitOfWork uow)
    : IRequestHandler<SetPromotionCommand, Result>
{
    public async Task<Result> Handle(SetPromotionCommand cmd, CancellationToken ct)
    {
        var course = await courseRepository.GetByIdAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure("Course not found.");
        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure("You do not own this course.");

        if (cmd.PromotionalPrice.HasValue && cmd.ExpiresAt.HasValue)
            course.SetPromotion(cmd.PromotionalPrice.Value, cmd.ExpiresAt.Value);
        else
            course.ClearPromotion();

        courseRepository.Update(course);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}
