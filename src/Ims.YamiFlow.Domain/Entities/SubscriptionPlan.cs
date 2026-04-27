using Ims.YamiFlow.Domain.Enums;

namespace Ims.YamiFlow.Domain.Entities;

public class SubscriptionPlan
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string StripeProductId { get; private set; } = string.Empty;
    public string StripePriceId { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "usd";
    public BillingInterval Interval { get; private set; }
    public int IntervalCount { get; private set; }
    public int? TrialDays { get; private set; }
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private SubscriptionPlan() { }

    public static SubscriptionPlan Create(
        string name,
        string description,
        string stripeProductId,
        string stripePriceId,
        decimal amount,
        string currency,
        BillingInterval interval,
        int intervalCount = 1,
        int? trialDays = null,
        int sortOrder = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Plan name is required.");
        if (string.IsNullOrWhiteSpace(stripePriceId))
            throw new DomainException("Stripe price id is required.");
        if (amount < 0)
            throw new DomainException("Amount cannot be negative.");

        return new SubscriptionPlan
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            StripeProductId = stripeProductId,
            StripePriceId = stripePriceId,
            Amount = amount,
            Currency = currency.ToLowerInvariant(),
            Interval = interval,
            IntervalCount = intervalCount,
            TrialDays = trialDays,
            IsActive = true,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;

    public void UpdateDetails(string name, string description, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Plan name is required.");
        Name = name;
        Description = description;
        SortOrder = sortOrder;
    }

    public void UpdateAmount(decimal amount)
    {
        if (amount < 0)
            throw new DomainException("Amount cannot be negative.");
        Amount = amount;
    }
}
