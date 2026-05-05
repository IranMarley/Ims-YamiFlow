using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Admin;

public record UpdateSubscriptionPlanCommand(
    Guid PlanId,
    string Name,
    string Description,
    decimal Amount,
    int SortOrder,
    string? StripeProductId,
    string? StripePriceId
);

public class UpdateSubscriptionPlanValidator : AbstractValidator<UpdateSubscriptionPlanCommand>
{
    public UpdateSubscriptionPlanValidator()
    {
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
        RuleFor(x => x.StripePriceId)
            .NotEmpty().WithMessage("StripePriceId is required when StripeProductId is provided.")
            .When(x => !string.IsNullOrWhiteSpace(x.StripeProductId));
    }
}

public class UpdateSubscriptionPlanHandler(
    ISubscriptionPlanRepository planRepo,
    IUnitOfWork uow,
    ICacheService cache)
    : IHandler<UpdateSubscriptionPlanCommand, Result>
{
    public async Task<Result> Handle(UpdateSubscriptionPlanCommand cmd, CancellationToken ct)
    {
        var plan = await planRepo.GetByIdAsync(cmd.PlanId, ct);
        if (plan is null)
            return Result.Failure("Subscription plan not found.");

        plan.UpdateDetails(cmd.Name, cmd.Description, cmd.SortOrder);
        plan.UpdateAmount(cmd.Amount);

        if (!string.IsNullOrWhiteSpace(cmd.StripePriceId))
            plan.UpdateStripeIds(cmd.StripeProductId ?? string.Empty, cmd.StripePriceId);

        planRepo.Update(plan);
        await uow.CommitAsync(ct);

        await cache.RemoveAsync(CacheKeys.PlansActive, ct);
        return Result.Success();
    }
}
