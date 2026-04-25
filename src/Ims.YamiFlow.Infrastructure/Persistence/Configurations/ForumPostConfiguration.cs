using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class ForumPostConfiguration : IEntityTypeConfiguration<ForumPost>
{
    public void Configure(EntityTypeBuilder<ForumPost> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.AuthorId).IsRequired();
        builder.Property(p => p.Title).IsRequired().HasMaxLength(300);
        builder.Property(p => p.Body).IsRequired().HasMaxLength(10000);

        builder.HasMany(p => p.Replies)
               .WithOne()
               .HasForeignKey(r => r.PostId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
