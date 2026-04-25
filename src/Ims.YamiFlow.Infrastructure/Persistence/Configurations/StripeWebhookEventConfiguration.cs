using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

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
