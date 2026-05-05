using System.Net;
using System.Net.Http.Json;
using Ims.YamiFlow.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ims.YamiFlow.Infrastructure.Services.Webhooks;

/// <summary>
/// Sends event payloads to a configured external webhook endpoint.
/// HTTP calls are protected by the Polly resilience pipeline registered
/// under <see cref="ClientName"/> via IHttpClientFactory.
/// </summary>
public sealed class ExternalWebhookService : IExternalWebhookService
{
    public const string ClientName = "ExternalWebhook";

    private readonly HttpClient _http;
    private readonly WebhookOptions _options;
    private readonly ILogger<ExternalWebhookService> _logger;

    public ExternalWebhookService(
        IHttpClientFactory factory,
        IOptions<WebhookOptions> options,
        ILogger<ExternalWebhookService> logger)
    {
        _http = factory.CreateClient(ClientName);
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> NotifyAsync(string eventType, object payload, CancellationToken ct = default)
    {
        if (!_options.IsConfigured)
        {
            _logger.LogDebug("Webhook not configured — skipping notification for {EventType}.", eventType);
            return true;
        }

        var envelope = new WebhookEnvelope(
            eventType,
            payload,
            DateTimeOffset.UtcNow);

        if (!string.IsNullOrWhiteSpace(_options.Secret))
            _http.DefaultRequestHeaders.TryAddWithoutValidation("X-Webhook-Secret", _options.Secret);

        var response = await _http.PostAsJsonAsync("events", envelope, ct);

        if (response.StatusCode == HttpStatusCode.ServiceUnavailable)
        {
            // Polly fallback returned 503 — circuit is open or retries exhausted.
            _logger.LogWarning("Webhook call for {EventType} returned service unavailable (circuit open).", eventType);
            return false;
        }

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Webhook for {EventType} returned {StatusCode}.", eventType, response.StatusCode);
            return false;
        }

        return true;
    }

    private sealed record WebhookEnvelope(string EventType, object Data, DateTimeOffset OccurredAt);
}
