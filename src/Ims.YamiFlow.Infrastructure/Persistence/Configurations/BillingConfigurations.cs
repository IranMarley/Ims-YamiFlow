using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> b)
    {
        b.ToTable("SubscriptionPlans");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(100);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.StripeProductId).IsRequired().HasMaxLength(100);
        b.Property(x => x.StripePriceId).IsRequired().HasMaxLength(100);
        b.HasIndex(x => x.StripePriceId).IsUnique();
        b.Property(x => x.Amount).HasPrecision(10, 2);
        b.Property(x => x.Currency).IsRequired().HasMaxLength(8);
        b.Property(x => x.Interval).HasConversion<string>().HasMaxLength(16);
    }
}

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> b)
    {
        b.ToTable("Subscriptions");
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        b.Property(x => x.StripeCustomerId).IsRequired().HasMaxLength(100);
        b.Property(x => x.StripeSubscriptionId).IsRequired().HasMaxLength(100);
        b.HasIndex(x => x.StripeSubscriptionId).IsUnique();
        b.HasIndex(x => x.UserId);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);

        b.HasOne<SubscriptionPlan>()
            .WithMany()
            .HasForeignKey(x => x.PlanId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("Payments");
        b.HasKey(x => x.Id);
        b.Property(x => x.UserId).IsRequired().HasMaxLength(450);
        b.Property(x => x.StripeCustomerId).HasMaxLength(100);
        b.Property(x => x.StripeInvoiceId).HasMaxLength(100);
        b.Property(x => x.StripePaymentIntentId).HasMaxLength(100);
        b.HasIndex(x => x.StripeInvoiceId).IsUnique().HasFilter("\"StripeInvoiceId\" IS NOT NULL");
        b.HasIndex(x => x.UserId);
        b.Property(x => x.Amount).HasPrecision(10, 2);
        b.Property(x => x.Currency).IsRequired().HasMaxLength(8);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        b.Property(x => x.Description).HasMaxLength(500);
        b.Property(x => x.FailureReason).HasMaxLength(500);
        b.Property(x => x.ReceiptUrl).HasMaxLength(500);

        b.HasOne<Subscription>()
            .WithMany()
            .HasForeignKey(x => x.SubscriptionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class StripeWebhookEventConfiguration : IEntityTypeConfiguration<StripeWebhookEvent>
{
    public void Configure(EntityTypeBuilder<StripeWebhookEvent> b)
    {
        b.ToTable("StripeWebhookEvents");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(100);
        b.Property(x => x.Type).IsRequired().HasMaxLength(100);
        b.Property(x => x.ProcessingError).HasMaxLength(2000);
    }
}
