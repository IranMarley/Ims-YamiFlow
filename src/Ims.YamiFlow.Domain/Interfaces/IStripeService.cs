namespace Ims.YamiFlow.Domain.Interfaces;

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

    string PublishableKey { get; }
}

public record StripeSubscriptionResult(
    string SubscriptionId,
    string CustomerId,
    string PriceId,
    string Status,
    DateTime? CurrentPeriodStart,
    DateTime? CurrentPeriodEnd,
    bool CancelAtPeriodEnd,
    DateTime? CanceledAt,
    DateTime? TrialEnd,
    string? LatestInvoiceId,
    string? ClientSecret);

public interface IStripeWebhookProcessor
{
    /// <summary>
    /// Verifies signature, deduplicates via StripeWebhookEvent table, processes the event,
    /// and persists resulting state changes. Returns a short description suitable for logging.
    /// Throws only on signature failure — all other errors are captured on the event row.
    /// </summary>
    Task<string> ProcessAsync(string rawPayload, string signatureHeader, CancellationToken ct = default);
}
