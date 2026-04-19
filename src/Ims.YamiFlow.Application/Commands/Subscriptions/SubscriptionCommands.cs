using FluentValidation;
using Ims.YamiFlow.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Application.Commands.Subscriptions;

// ── Responses ─────────────────────────────────────────
public record SubscribeResponse(
    Guid SubscriptionId,
    string StripeSubscriptionId,
    string Status,
    string? ClientSecret,
    string? PublishableKey);

// ── Subscribe ─────────────────────────────────────────
public record SubscribeCommand(string UserId, Guid PlanId) : IRequest<Result<SubscribeResponse>>;

public class SubscribeValidator : AbstractValidator<SubscribeCommand>
{
    public SubscribeValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
    }
}

public class SubscribeHandler(
    ISubscriptionPlanRepository plans,
    ISubscriptionRepository subscriptions,
    IAuthUserService users,
    IStripeService stripe,
    IUserStripeCustomerService customerService,
    IUnitOfWork uow,
    ILogger<SubscribeHandler> logger)
    : IRequestHandler<SubscribeCommand, Result<SubscribeResponse>>
{
    public async Task<Result<SubscribeResponse>> Handle(SubscribeCommand cmd, CancellationToken ct)
    {
        // Reject if user already has an access-granting subscription
        var existing = await subscriptions.GetActiveByUserAsync(cmd.UserId, ct);
        if (existing is not null && existing.GrantsAccess())
            return Result.Failure<SubscribeResponse>("You already have an active subscription.");

        var plan = await plans.GetByIdAsync(cmd.PlanId, ct);
        if (plan is null || !plan.IsActive)
            return Result.Failure<SubscribeResponse>("Plan not found or inactive.");

        var user = await users.FindByIdAsync(cmd.UserId, ct);
        if (user is null) return Result.Failure<SubscribeResponse>("User not found.");

        var stripeCustomerId = await customerService.GetStripeCustomerIdAsync(cmd.UserId, ct);
        stripeCustomerId = await stripe.CreateOrGetCustomerAsync(
            cmd.UserId, user.Email, user.FullName, stripeCustomerId, ct);
        await customerService.SetStripeCustomerIdAsync(cmd.UserId, stripeCustomerId, ct);

        // Idempotency: retrying SubscribeCommand with same user+plan should not create duplicate Stripe subs
        var idempotencyKey = $"sub-{cmd.UserId}-{cmd.PlanId}";

        var stripeResult = await stripe.CreateSubscriptionAsync(
            stripeCustomerId, plan.StripePriceId, plan.TrialDays, idempotencyKey, ct);

        var status = MapStatus(stripeResult.Status);

        // If an Incomplete record for this Stripe sub already exists, reuse it instead of inserting duplicate
        var existingLocal = await subscriptions.GetByStripeSubscriptionIdAsync(stripeResult.SubscriptionId, ct);
        if (existingLocal is null)
        {
            var sub = Subscription.Create(
                cmd.UserId, plan.Id, stripeCustomerId, stripeResult.SubscriptionId, status);
            sub.SyncFromStripe(
                status,
                stripeResult.CurrentPeriodStart,
                stripeResult.CurrentPeriodEnd,
                stripeResult.CancelAtPeriodEnd,
                stripeResult.CanceledAt,
                stripeResult.TrialEnd);
            await subscriptions.AddAsync(sub, ct);
        }

        await uow.CommitAsync(ct);

        logger.LogInformation("Subscription {StripeSubId} created for user {UserId}",
            stripeResult.SubscriptionId, cmd.UserId);

        return Result.Success(new SubscribeResponse(
            existingLocal?.Id ?? Guid.Empty,
            stripeResult.SubscriptionId,
            stripeResult.Status,
            stripeResult.ClientSecret,
            PublishableKey: null));
    }

    internal static SubscriptionStatus MapStatus(string stripeStatus) => stripeStatus switch
    {
        "active" => SubscriptionStatus.Active,
        "trialing" => SubscriptionStatus.Trialing,
        "past_due" => SubscriptionStatus.PastDue,
        "canceled" => SubscriptionStatus.Canceled,
        "unpaid" => SubscriptionStatus.Unpaid,
        "incomplete" => SubscriptionStatus.Incomplete,
        "incomplete_expired" => SubscriptionStatus.IncompleteExpired,
        "paused" => SubscriptionStatus.Paused,
        _ => SubscriptionStatus.Incomplete
    };
}

// ── Cancel ────────────────────────────────────────────
public record CancelSubscriptionCommand(string UserId, bool AtPeriodEnd = true) : IRequest<Result>;

public class CancelSubscriptionValidator : AbstractValidator<CancelSubscriptionCommand>
{
    public CancelSubscriptionValidator() => RuleFor(x => x.UserId).NotEmpty();
}

public class CancelSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    IStripeService stripe,
    IUnitOfWork uow)
    : IRequestHandler<CancelSubscriptionCommand, Result>
{
    public async Task<Result> Handle(CancelSubscriptionCommand cmd, CancellationToken ct)
    {
        var sub = await subscriptions.GetActiveByUserAsync(cmd.UserId, ct);
        if (sub is null) return Result.Failure("No active subscription found.");

        var stripeResult = await stripe.CancelSubscriptionAsync(
            sub.StripeSubscriptionId, cmd.AtPeriodEnd, ct);

        sub.SyncFromStripe(
            SubscribeHandler.MapStatus(stripeResult.Status),
            stripeResult.CurrentPeriodStart,
            stripeResult.CurrentPeriodEnd,
            stripeResult.CancelAtPeriodEnd,
            stripeResult.CanceledAt,
            stripeResult.TrialEnd);
        subscriptions.Update(sub);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}

// ── Resume ────────────────────────────────────────────
public record ResumeSubscriptionCommand(string UserId) : IRequest<Result>;

public class ResumeSubscriptionValidator : AbstractValidator<ResumeSubscriptionCommand>
{
    public ResumeSubscriptionValidator() => RuleFor(x => x.UserId).NotEmpty();
}

public class ResumeSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    IStripeService stripe,
    IUnitOfWork uow)
    : IRequestHandler<ResumeSubscriptionCommand, Result>
{
    public async Task<Result> Handle(ResumeSubscriptionCommand cmd, CancellationToken ct)
    {
        var sub = await subscriptions.GetLatestByUserAsync(cmd.UserId, ct);
        if (sub is null) return Result.Failure("No subscription found.");
        if (!sub.CancelAtPeriodEnd)
            return Result.Failure("Subscription is not scheduled to cancel.");

        var stripeResult = await stripe.ResumeSubscriptionAsync(sub.StripeSubscriptionId, ct);

        sub.SyncFromStripe(
            SubscribeHandler.MapStatus(stripeResult.Status),
            stripeResult.CurrentPeriodStart,
            stripeResult.CurrentPeriodEnd,
            stripeResult.CancelAtPeriodEnd,
            stripeResult.CanceledAt,
            stripeResult.TrialEnd);
        subscriptions.Update(sub);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}

/// <summary>
/// Resolves/updates the Stripe customer id on the AppUser Identity row.
/// Defined in Application so the handler doesn't depend on Infrastructure directly.
/// </summary>
public interface IUserStripeCustomerService
{
    Task<string?> GetStripeCustomerIdAsync(string userId, CancellationToken ct = default);
    Task SetStripeCustomerIdAsync(string userId, string customerId, CancellationToken ct = default);
}
