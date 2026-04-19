using Ims.YamiFlow.Domain.Enums;

namespace Ims.YamiFlow.Domain.Entities;

public class Subscription
{
    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public Guid PlanId { get; private set; }
    public string StripeCustomerId { get; private set; } = string.Empty;
    public string StripeSubscriptionId { get; private set; } = string.Empty;
    public SubscriptionStatus Status { get; private set; }
    public DateTime? CurrentPeriodStart { get; private set; }
    public DateTime? CurrentPeriodEnd { get; private set; }
    public bool CancelAtPeriodEnd { get; private set; }
    public DateTime? CanceledAt { get; private set; }
    public DateTime? TrialEnd { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Subscription() { }

    public static Subscription Create(
        string userId,
        Guid planId,
        string stripeCustomerId,
        string stripeSubscriptionId,
        SubscriptionStatus status)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new DomainException("UserId is required.");
        if (string.IsNullOrWhiteSpace(stripeCustomerId))
            throw new DomainException("Stripe customer id is required.");
        if (string.IsNullOrWhiteSpace(stripeSubscriptionId))
            throw new DomainException("Stripe subscription id is required.");

        var now = DateTime.UtcNow;
        return new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PlanId = planId,
            StripeCustomerId = stripeCustomerId,
            StripeSubscriptionId = stripeSubscriptionId,
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void SyncFromStripe(
        SubscriptionStatus status,
        DateTime? currentPeriodStart,
        DateTime? currentPeriodEnd,
        bool cancelAtPeriodEnd,
        DateTime? canceledAt,
        DateTime? trialEnd,
        Guid? planId = null)
    {
        Status = status;
        CurrentPeriodStart = currentPeriodStart;
        CurrentPeriodEnd = currentPeriodEnd;
        CancelAtPeriodEnd = cancelAtPeriodEnd;
        CanceledAt = canceledAt;
        TrialEnd = trialEnd;
        if (planId.HasValue) PlanId = planId.Value;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkCanceled()
    {
        Status = SubscriptionStatus.Canceled;
        CanceledAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool GrantsAccess() =>
        Status is SubscriptionStatus.Active or SubscriptionStatus.Trialing;
}
