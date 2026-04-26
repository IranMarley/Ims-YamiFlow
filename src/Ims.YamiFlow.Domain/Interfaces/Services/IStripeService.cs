namespace Ims.YamiFlow.Domain.Interfaces.Services;

/// <summary>
/// Thin abstraction over Stripe, defined in Domain so Application can depend on it.
/// Concrete implementation lives in Infrastructure using Stripe.net.
/// </summary>
public interface IStripeService
{
    Task<string> CreateOrGetCustomerAsync(
        string userId,
        string email,
        string? fullName,
        string? existingCustomerId,
        CancellationToken ct = default);

    Task<StripeSubscriptionResult> CreateSubscriptionAsync(
        string customerId,
        string priceId,
        int? trialDays,
        string idempotencyKey,
        CancellationToken ct = default);

    Task<StripeSubscriptionResult> CancelSubscriptionAsync(
        string subscriptionId,
        bool atPeriodEnd,
        CancellationToken ct = default);

    Task<StripeSubscriptionResult> ResumeSubscriptionAsync(
        string subscriptionId,
        CancellationToken ct = default);

    Task<StripeSubscriptionResult> GetSubscriptionAsync(
        string subscriptionId,
        CancellationToken ct = default);

    Task<StripeSubscriptionResult> SwitchPlanAsync(
        string subscriptionId,
        string newPriceId,
        CancellationToken ct = default);

    string PublishableKey { get; }
}
