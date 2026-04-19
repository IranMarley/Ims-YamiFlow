namespace Ims.YamiFlow.Domain.Entities;

/// <summary>
/// Tracks processed Stripe webhook events to guarantee idempotent handling.
/// Stripe retries failed webhook deliveries; using the event id as PK lets us
/// short-circuit duplicates safely.
/// </summary>
public class StripeWebhookEvent
{
    public string Id { get; private set; } = string.Empty;
    public string Type { get; private set; } = string.Empty;
    public DateTime ReceivedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public string? ProcessingError { get; private set; }

    private StripeWebhookEvent() { }

    public static StripeWebhookEvent Create(string id, string type) => new()
    {
        Id = id,
        Type = type,
        ReceivedAt = DateTime.UtcNow
    };

    public void MarkProcessed()
    {
        ProcessedAt = DateTime.UtcNow;
        ProcessingError = null;
    }

    public void MarkFailed(string error)
    {
        ProcessingError = error;
    }
}
