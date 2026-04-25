using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;

namespace Ims.YamiFlow.Infrastructure.Services.Stripe;

/// <summary>
/// Stripe.net wrapper. All Domain/Application layers depend only on IStripeService,
/// so Stripe SDK types never leak outside Infrastructure.
/// </summary>
public class StripeService : IStripeService
{
    private readonly StripeOptions _options;
    private readonly ILogger<StripeService> _logger;
    private readonly CustomerService _customers;
    private readonly SubscriptionService _subscriptions;

    public StripeService(IOptions<StripeOptions> options, ILogger<StripeService> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (string.IsNullOrWhiteSpace(_options.SecretKey))
            _logger.LogWarning("Stripe SecretKey is not configured — Stripe calls will fail.");

        StripeConfiguration.ApiKey = _options.SecretKey;

        _customers = new CustomerService();
        _subscriptions = new SubscriptionService();
    }

    public async Task<string> CreateOrGetCustomerAsync(
        string userId,
        string email,
        string? fullName,
        string? existingCustomerId,
        CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(existingCustomerId))
        {
            try
            {
                var existing = await _customers.GetAsync(existingCustomerId, cancellationToken: ct);
                if (existing is not null && existing.Deleted != true)
                    return existing.Id;
            }
            catch (StripeException ex) when (ex.StripeError?.Code == "resource_missing")
            {
                _logger.LogWarning("Stripe customer {CustomerId} missing, creating new one.", existingCustomerId);
            }
        }

        var created = await _customers.CreateAsync(new CustomerCreateOptions
        {
            Email = email,
            Name = fullName,
            Metadata = new Dictionary<string, string> { ["userId"] = userId }
        }, new RequestOptions { IdempotencyKey = $"customer-{userId}" }, ct);

        return created.Id;
    }

    public async Task<StripeSubscriptionResult> CreateSubscriptionAsync(
        string customerId,
        string priceId,
        int? trialDays,
        string idempotencyKey,
        CancellationToken ct = default)
    {
        var options = new SubscriptionCreateOptions
        {
            Customer = customerId,
            Items = [new SubscriptionItemOptions { Price = priceId }],
            PaymentBehavior = "default_incomplete",
            PaymentSettings = new SubscriptionPaymentSettingsOptions
            {
                SaveDefaultPaymentMethod = "on_subscription"
            },
            Expand = ["latest_invoice.payment_intent"]
        };

        if (trialDays.HasValue && trialDays.Value > 0)
            options.TrialPeriodDays = trialDays.Value;

        var sub = await _subscriptions.CreateAsync(
            options,
            new RequestOptions { IdempotencyKey = idempotencyKey },
            ct);

        return Map(sub);
    }

    public async Task<StripeSubscriptionResult> CancelSubscriptionAsync(
        string subscriptionId,
        bool atPeriodEnd,
        CancellationToken ct = default)
    {
        Subscription sub;
        if (atPeriodEnd)
        {
            sub = await _subscriptions.UpdateAsync(subscriptionId,
                new SubscriptionUpdateOptions { CancelAtPeriodEnd = true },
                cancellationToken: ct);
        }
        else
        {
            sub = await _subscriptions.CancelAsync(subscriptionId,
                new SubscriptionCancelOptions(), cancellationToken: ct);
        }
        return Map(sub);
    }

    public async Task<StripeSubscriptionResult> ResumeSubscriptionAsync(
        string subscriptionId,
        CancellationToken ct = default)
    {
        var sub = await _subscriptions.UpdateAsync(subscriptionId,
            new SubscriptionUpdateOptions { CancelAtPeriodEnd = false },
            cancellationToken: ct);
        return Map(sub);
    }

    public async Task<StripeSubscriptionResult> GetSubscriptionAsync(
        string subscriptionId,
        CancellationToken ct = default)
    {
        var sub = await _subscriptions.GetAsync(subscriptionId,
            new SubscriptionGetOptions { Expand = ["latest_invoice.payment_intent"] },
            cancellationToken: ct);
        return Map(sub);
    }

    public string PublishableKey => _options.PublishableKey;

    private static StripeSubscriptionResult Map(Subscription sub)
    {
        var firstItem = sub.Items?.Data?.FirstOrDefault();
        var priceId = firstItem?.Price?.Id ?? string.Empty;

        string? clientSecret = null;
        string? invoiceId = null;
        if (sub.LatestInvoice is not null)
        {
            invoiceId = sub.LatestInvoice.Id;
            clientSecret = sub.LatestInvoice.PaymentIntent?.ClientSecret;
        }

        return new StripeSubscriptionResult(
            sub.Id,
            sub.CustomerId,
            priceId,
            sub.Status,
            sub.CurrentPeriodStart,
            sub.CurrentPeriodEnd,
            sub.CancelAtPeriodEnd,
            sub.CanceledAt,
            sub.TrialEnd,
            invoiceId,
            clientSecret);
    }
}
