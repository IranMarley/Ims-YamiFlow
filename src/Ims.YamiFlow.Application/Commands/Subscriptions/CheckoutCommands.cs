using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Application.Commands.Subscriptions;

public record InitiateCheckoutCommand(string UserId, Guid PlanId, string SuccessUrl, string CancelUrl);

public class InitiateCheckoutValidator : AbstractValidator<InitiateCheckoutCommand>
{
    public InitiateCheckoutValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.SuccessUrl).NotEmpty().Must(x => Uri.IsWellFormedUriString(x, UriKind.Absolute));
        RuleFor(x => x.CancelUrl).NotEmpty().Must(x => Uri.IsWellFormedUriString(x, UriKind.Absolute));
    }
}

public record InitiateCheckoutResponse(string SessionUrl);

public class InitiateCheckoutHandler(
    ISubscriptionPlanRepository plans,
    IAuthUserService users,
    IStripeService stripe,
    IUserStripeCustomerService customerService,
    ILogger<InitiateCheckoutHandler> logger)
    : IHandler<InitiateCheckoutCommand, Result<InitiateCheckoutResponse>>
{
    public async Task<Result<InitiateCheckoutResponse>> Handle(InitiateCheckoutCommand cmd, CancellationToken ct)
    {
        var plan = await plans.GetByIdAsync(cmd.PlanId, ct);
        if (plan is null || !plan.IsActive)
            return Result.Failure<InitiateCheckoutResponse>("Plan not found or inactive.");

        var user = await users.FindByIdAsync(cmd.UserId, ct);
        if (user is null)
            return Result.Failure<InitiateCheckoutResponse>("User not found.");

        var stripeCustomerId = await customerService.GetStripeCustomerIdAsync(cmd.UserId, ct);
        stripeCustomerId = await stripe.CreateOrGetCustomerAsync(
            cmd.UserId, user.Email, user.FullName, stripeCustomerId, ct);
        await customerService.SetStripeCustomerIdAsync(cmd.UserId, stripeCustomerId, ct);

        var sessionResult = await stripe.CreateCheckoutSessionAsync(
            stripeCustomerId,
            plan.StripePriceId,
            cmd.SuccessUrl,
            cmd.CancelUrl,
            ct);

        logger.LogInformation("Checkout session {SessionId} initiated for user {UserId} on plan {PlanId}",
            sessionResult.SessionId, cmd.UserId, cmd.PlanId);

        return Result.Success(new InitiateCheckoutResponse(sessionResult.Url));
    }
}
