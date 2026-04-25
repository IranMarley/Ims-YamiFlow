namespace Ims.YamiFlow.Domain.Interfaces.Services;

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
