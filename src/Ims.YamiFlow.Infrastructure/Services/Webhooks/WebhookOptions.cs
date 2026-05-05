namespace Ims.YamiFlow.Infrastructure.Services.Webhooks;

public sealed class WebhookOptions
{
    public const string SectionName = "Webhook";

    public string BaseUrl { get; init; } = string.Empty;

    /// <summary>Shared secret sent as X-Webhook-Secret header.</summary>
    public string Secret { get; init; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(BaseUrl);
}
