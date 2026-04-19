using Ims.YamiFlow.Domain.Enums;

namespace Ims.YamiFlow.Domain.Entities;

public class Payment
{
    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public Guid? SubscriptionId { get; private set; }
    public string StripeCustomerId { get; private set; } = string.Empty;
    public string? StripeInvoiceId { get; private set; }
    public string? StripePaymentIntentId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "usd";
    public PaymentStatus Status { get; private set; }
    public string? Description { get; private set; }
    public string? FailureReason { get; private set; }
    public string? ReceiptUrl { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? PaidAt { get; private set; }

    private Payment() { }

    public static Payment Create(
        string userId,
        Guid? subscriptionId,
        string stripeCustomerId,
        string? stripeInvoiceId,
        string? stripePaymentIntentId,
        decimal amount,
        string currency,
        PaymentStatus status,
        string? description = null)
    {
        return new Payment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SubscriptionId = subscriptionId,
            StripeCustomerId = stripeCustomerId,
            StripeInvoiceId = stripeInvoiceId,
            StripePaymentIntentId = stripePaymentIntentId,
            Amount = amount,
            Currency = currency.ToLowerInvariant(),
            Status = status,
            Description = description,
            CreatedAt = DateTime.UtcNow,
            PaidAt = status == PaymentStatus.Paid ? DateTime.UtcNow : null
        };
    }

    public void MarkPaid(string? receiptUrl)
    {
        Status = PaymentStatus.Paid;
        PaidAt = DateTime.UtcNow;
        ReceiptUrl = receiptUrl;
        FailureReason = null;
    }

    public void MarkFailed(string? reason)
    {
        Status = PaymentStatus.Failed;
        FailureReason = reason;
    }

    public void MarkRefunded()
    {
        Status = PaymentStatus.Refunded;
    }
}
