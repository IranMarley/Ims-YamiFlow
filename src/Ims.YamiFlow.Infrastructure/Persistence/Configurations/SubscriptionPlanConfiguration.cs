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
