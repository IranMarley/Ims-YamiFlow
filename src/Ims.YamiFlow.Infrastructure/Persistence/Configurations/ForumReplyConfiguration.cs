using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class ForumReplyConfiguration : IEntityTypeConfiguration<ForumReply>
{
    public void Configure(EntityTypeBuilder<ForumReply> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.AuthorId).IsRequired();
        builder.Property(r => r.Body).IsRequired().HasMaxLength(10000);
    }
}
