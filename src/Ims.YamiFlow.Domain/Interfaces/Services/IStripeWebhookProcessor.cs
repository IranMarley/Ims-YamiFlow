namespace Ims.YamiFlow.Domain.Interfaces.Services;

public interface IStripeWebhookProcessor
{
    /// <summary>
    /// Verifies signature, deduplicates via StripeWebhookEvent table, processes the event,
    /// and persists resulting state changes. Returns a short description suitable for logging.
    /// Throws only on signature failure — all other errors are captured on the event row.
    /// </summary>
    Task<string> ProcessAsync(string rawPayload, string signatureHeader, CancellationToken ct = default);
}
