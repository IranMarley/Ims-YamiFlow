using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

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
