using FluentValidation;
using Ims.YamiFlow.Domain.Enums;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;
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
public record SubscribeCommand(string UserId, Guid PlanId, bool Simulate = false);

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
    : IHandler<SubscribeCommand, Result<SubscribeResponse>>
{
    public async Task<Result<SubscribeResponse>> Handle(SubscribeCommand cmd, CancellationToken ct)
    {
        var plan = await plans.GetByIdAsync(cmd.PlanId, ct);
        if (plan is null || !plan.IsActive)
            return Result.Failure<SubscribeResponse>("Plan not found or inactive.");

        var existing = await subscriptions.GetActiveByUserAsync(cmd.UserId, ct);
        if (existing is not null && existing.GrantsAccess())
        {
            if (existing.PlanId == cmd.PlanId)
                return Result.Failure<SubscribeResponse>("You are already on this plan.");

            // Switch plan
            if (cmd.Simulate || existing.StripeSubscriptionId.StartsWith("sim_"))
            {
                existing.MarkCanceled();
                subscriptions.Update(existing);

                var switchSimSubId = $"sim_sub_{Guid.NewGuid():N}";
                var switchSimSub = Subscription.Create(
                    cmd.UserId, plan.Id, existing.StripeCustomerId, switchSimSubId, SubscriptionStatus.Active);
                switchSimSub.SyncFromStripe(
                    SubscriptionStatus.Active,
                    DateTime.UtcNow,
                    DateTime.UtcNow.AddMonths(plan.Interval == Domain.Enums.BillingInterval.Year ? 12 : 1),
                    cancelAtPeriodEnd: false,
                    canceledAt: null,
                    trialEnd: null);
                await subscriptions.AddAsync(switchSimSub, ct);
                await uow.CommitAsync(ct);
                logger.LogInformation("Simulated plan switch to {PlanId} for user {UserId}", plan.Id, cmd.UserId);
                return Result.Success(new SubscribeResponse(switchSimSub.Id, switchSimSubId, "active", null, null));
            }
            else
            {
                var switchResult = await stripe.SwitchPlanAsync(existing.StripeSubscriptionId, plan.StripePriceId, ct);
                existing.SyncFromStripe(
                    MapStatus(switchResult.Status),
                    switchResult.CurrentPeriodStart,
                    switchResult.CurrentPeriodEnd,
                    switchResult.CancelAtPeriodEnd,
                    switchResult.CanceledAt,
                    switchResult.TrialEnd,
                    planId: plan.Id);
                subscriptions.Update(existing);
                await uow.CommitAsync(ct);
                logger.LogInformation("Switched plan to {PlanId} for user {UserId}", plan.Id, cmd.UserId);
                return Result.Success(new SubscribeResponse(existing.Id, existing.StripeSubscriptionId, switchResult.Status, switchResult.ClientSecret, null));
            }
        }

        var user = await users.FindByIdAsync(cmd.UserId, ct);
        if (user is null) return Result.Failure<SubscribeResponse>("User not found.");

        if (cmd.Simulate)
        {
            var simSubId = $"sim_sub_{Guid.NewGuid():N}";
            var simCusId = $"sim_cus_{cmd.UserId[..Math.Min(8, cmd.UserId.Length)]}";
            var simSub = Subscription.Create(cmd.UserId, plan.Id, simCusId, simSubId, SubscriptionStatus.Active);
            simSub.SyncFromStripe(
                SubscriptionStatus.Active,
                DateTime.UtcNow,
                DateTime.UtcNow.AddMonths(plan.Interval == Domain.Enums.BillingInterval.Year ? 12 : 1),
                cancelAtPeriodEnd: false,
                canceledAt: null,
                trialEnd: null);
            await subscriptions.AddAsync(simSub, ct);
            await uow.CommitAsync(ct);
            logger.LogInformation("Simulated subscription {SubId} for user {UserId}", simSubId, cmd.UserId);
            return Result.Success(new SubscribeResponse(simSub.Id, simSubId, "active", null, null));
        }

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
public record CancelSubscriptionCommand(string UserId, bool AtPeriodEnd = true);

public class CancelSubscriptionValidator : AbstractValidator<CancelSubscriptionCommand>
{
    public CancelSubscriptionValidator() => RuleFor(x => x.UserId).NotEmpty();
}

public class CancelSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    IStripeService stripe,
    IUnitOfWork uow)
    : IHandler<CancelSubscriptionCommand, Result>
{
    public async Task<Result> Handle(CancelSubscriptionCommand cmd, CancellationToken ct)
    {
        var sub = await subscriptions.GetActiveByUserAsync(cmd.UserId, ct);
        if (sub is null) return Result.Failure("No active subscription found.");

        if (sub.StripeSubscriptionId.StartsWith("sim_"))
        {
            sub.SyncFromStripe(
                sub.Status,
                sub.CurrentPeriodStart,
                sub.CurrentPeriodEnd,
                cancelAtPeriodEnd: cmd.AtPeriodEnd,
                canceledAt: cmd.AtPeriodEnd ? null : DateTime.UtcNow,
                trialEnd: sub.TrialEnd);
        }
        else
        {
            var stripeResult = await stripe.CancelSubscriptionAsync(
                sub.StripeSubscriptionId, cmd.AtPeriodEnd, ct);

            sub.SyncFromStripe(
                SubscribeHandler.MapStatus(stripeResult.Status),
                stripeResult.CurrentPeriodStart,
                stripeResult.CurrentPeriodEnd,
                stripeResult.CancelAtPeriodEnd,
                stripeResult.CanceledAt,
                stripeResult.TrialEnd);
        }

        subscriptions.Update(sub);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}

// ── Resume ────────────────────────────────────────────
public record ResumeSubscriptionCommand(string UserId);

public class ResumeSubscriptionValidator : AbstractValidator<ResumeSubscriptionCommand>
{
    public ResumeSubscriptionValidator() => RuleFor(x => x.UserId).NotEmpty();
}

public class ResumeSubscriptionHandler(
    ISubscriptionRepository subscriptions,
    IStripeService stripe,
    IUnitOfWork uow)
    : IHandler<ResumeSubscriptionCommand, Result>
{
    public async Task<Result> Handle(ResumeSubscriptionCommand cmd, CancellationToken ct)
    {
        var sub = await subscriptions.GetLatestByUserAsync(cmd.UserId, ct);
        if (sub is null) return Result.Failure("No subscription found.");
        if (!sub.CancelAtPeriodEnd)
            return Result.Failure("Subscription is not scheduled to cancel.");

        if (sub.StripeSubscriptionId.StartsWith("sim_"))
        {
            sub.SyncFromStripe(
                sub.Status,
                sub.CurrentPeriodStart,
                sub.CurrentPeriodEnd,
                cancelAtPeriodEnd: false,
                canceledAt: null,
                trialEnd: sub.TrialEnd);
        }
        else
        {
            var stripeResult = await stripe.ResumeSubscriptionAsync(sub.StripeSubscriptionId, ct);

            sub.SyncFromStripe(
                SubscribeHandler.MapStatus(stripeResult.Status),
                stripeResult.CurrentPeriodStart,
                stripeResult.CurrentPeriodEnd,
                stripeResult.CancelAtPeriodEnd,
                stripeResult.CanceledAt,
                stripeResult.TrialEnd);
        }

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
