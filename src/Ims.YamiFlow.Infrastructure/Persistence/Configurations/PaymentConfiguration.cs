using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

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
