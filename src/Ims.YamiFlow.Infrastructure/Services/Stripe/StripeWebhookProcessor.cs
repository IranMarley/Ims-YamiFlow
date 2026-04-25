using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Enums;

using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using DomainSubscription = Ims.YamiFlow.Domain.Entities.Subscription;
using StripeSubscription = Stripe.Subscription;

namespace Ims.YamiFlow.Infrastructure.Services.Stripe;

/// <summary>
/// Handles Stripe webhook events. Idempotent: each event id is recorded in
/// StripeWebhookEvents; duplicates are ignored.
///
/// Events handled:
///  - customer.subscription.created / updated / deleted
///  - invoice.paid / invoice.payment_failed
///  - checkout.session.completed (defensive; not used in Elements flow)
/// </summary>
public class StripeWebhookProcessor(
    IOptions<StripeOptions> options,
    IStripeWebhookEventRepository events,
    ISubscriptionRepository subscriptions,
    ISubscriptionPlanRepository plans,
    IPaymentRepository payments,
    IUnitOfWork uow,
    ILogger<StripeWebhookProcessor> logger)
    : IStripeWebhookProcessor
{
    private readonly StripeOptions _options = options.Value;

    public async Task<string> ProcessAsync(string rawPayload, string signatureHeader, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.WebhookSecret))
            throw new InvalidOperationException("Stripe WebhookSecret not configured.");

        // Verify signature FIRST — protects against spoofed webhooks.
        var evt = EventUtility.ConstructEvent(
            rawPayload,
            signatureHeader,
            _options.WebhookSecret,
            throwOnApiVersionMismatch: false);

        // Idempotency guard
        if (await events.ExistsAsync(evt.Id, ct))
        {
            logger.LogInformation("Duplicate Stripe event {EventId} ignored.", evt.Id);
            return $"duplicate:{evt.Type}";
        }

        var record = StripeWebhookEvent.Create(evt.Id, evt.Type);
        await events.AddAsync(record, ct);

        try
        {
            await DispatchAsync(evt, ct);
            record.MarkProcessed();
        }
        catch (Exception ex)
        {
            record.MarkFailed(ex.Message);
            logger.LogError(ex, "Failed processing Stripe event {EventId} of type {Type}", evt.Id, evt.Type);
            // Persist the failure then rethrow so Stripe retries
            await uow.CommitAsync(ct);
            throw;
        }

        await uow.CommitAsync(ct);
        return evt.Type;
    }

    private async Task DispatchAsync(Event evt, CancellationToken ct)
    {
        switch (evt.Type)
        {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                await HandleSubscriptionChangedAsync((StripeSubscription)evt.Data.Object, ct);
                break;

            case "invoice.paid":
            case "invoice.payment_succeeded":
                await HandleInvoicePaidAsync((Invoice)evt.Data.Object, ct);
                break;

            case "invoice.payment_failed":
                await HandleInvoiceFailedAsync((Invoice)evt.Data.Object, ct);
                break;

            default:
                logger.LogDebug("Ignoring unhandled Stripe event type {Type}", evt.Type);
                break;
        }
    }

    private async Task HandleSubscriptionChangedAsync(StripeSubscription stripeSub, CancellationToken ct)
    {
        var local = await subscriptions.GetByStripeSubscriptionIdAsync(stripeSub.Id, ct);
        var status = MapStatus(stripeSub.Status);
        var firstItem = stripeSub.Items?.Data?.FirstOrDefault();
        var priceId = firstItem?.Price?.Id;

        Guid? planId = null;
        if (priceId is not null)
        {
            var plan = await plans.GetByStripePriceIdAsync(priceId, ct);
            planId = plan?.Id;
        }

        if (local is null)
        {
            // Subscription created out-of-band (eg. via Stripe dashboard). Best effort: store.
            var userId = stripeSub.Metadata?.GetValueOrDefault("userId");
            if (string.IsNullOrEmpty(userId) || planId is null)
            {
                logger.LogWarning("Stripe subscription {Id} arrived without a matching local record or resolvable plan/user.", stripeSub.Id);
                return;
            }

            local = DomainSubscription.Create(userId, planId.Value, stripeSub.CustomerId, stripeSub.Id, status);
            local.SyncFromStripe(
                status,
                stripeSub.CurrentPeriodStart,
                stripeSub.CurrentPeriodEnd,
                stripeSub.CancelAtPeriodEnd,
                stripeSub.CanceledAt,
                stripeSub.TrialEnd,
                planId);
            await subscriptions.AddAsync(local, ct);
            return;
        }

        local.SyncFromStripe(
            status,
            stripeSub.CurrentPeriodStart,
            stripeSub.CurrentPeriodEnd,
            stripeSub.CancelAtPeriodEnd,
            stripeSub.CanceledAt,
            stripeSub.TrialEnd,
            planId);
        subscriptions.Update(local);
    }

    private async Task HandleInvoicePaidAsync(Invoice invoice, CancellationToken ct)
    {
        // Idempotent: one Payment row per Stripe invoice
        var existing = await payments.GetByStripeInvoiceIdAsync(invoice.Id, ct);
        var subscriptionId = await ResolveLocalSubscriptionIdAsync(invoice, ct);
        var userId = await ResolveUserIdAsync(invoice, ct);

        if (existing is null)
        {
            if (userId is null)
            {
                logger.LogWarning("Invoice {InvoiceId} paid but userId could not be resolved.", invoice.Id);
                return;
            }
            var payment = Payment.Create(
                userId,
                subscriptionId,
                invoice.CustomerId,
                invoice.Id,
                invoice.PaymentIntentId,
                invoice.AmountPaid / 100m,
                invoice.Currency ?? "usd",
                PaymentStatus.Paid,
                invoice.Description);
            payment.MarkPaid(invoice.HostedInvoiceUrl);
            await payments.AddAsync(payment, ct);
        }
        else
        {
            existing.MarkPaid(invoice.HostedInvoiceUrl);
            payments.Update(existing);
        }
    }

    private async Task HandleInvoiceFailedAsync(Invoice invoice, CancellationToken ct)
    {
        var existing = await payments.GetByStripeInvoiceIdAsync(invoice.Id, ct);
        var userId = await ResolveUserIdAsync(invoice, ct);
        var subscriptionId = await ResolveLocalSubscriptionIdAsync(invoice, ct);
        var reason = invoice.LastFinalizationError?.Message
                     ?? invoice.PaymentIntent?.LastPaymentError?.Message
                     ?? "Payment failed";

        if (existing is null && userId is not null)
        {
            var payment = Payment.Create(
                userId, subscriptionId, invoice.CustomerId, invoice.Id,
                invoice.PaymentIntentId,
                invoice.AmountDue / 100m, invoice.Currency ?? "usd",
                PaymentStatus.Failed, invoice.Description);
            payment.MarkFailed(reason);
            await payments.AddAsync(payment, ct);
        }
        else if (existing is not null)
        {
            existing.MarkFailed(reason);
            payments.Update(existing);
        }
    }

    private async Task<Guid?> ResolveLocalSubscriptionIdAsync(Invoice invoice, CancellationToken ct)
    {
        var stripeSubId = invoice.SubscriptionId;
        if (string.IsNullOrEmpty(stripeSubId)) return null;
        var sub = await subscriptions.GetByStripeSubscriptionIdAsync(stripeSubId, ct);
        return sub?.Id;
    }

    private async Task<string?> ResolveUserIdAsync(Invoice invoice, CancellationToken ct)
    {
        var stripeSubId = invoice.SubscriptionId;
        if (!string.IsNullOrEmpty(stripeSubId))
        {
            var sub = await subscriptions.GetByStripeSubscriptionIdAsync(stripeSubId, ct);
            if (sub is not null) return sub.UserId;
        }
        return null;
    }

    private static SubscriptionStatus MapStatus(string s) => s switch
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
