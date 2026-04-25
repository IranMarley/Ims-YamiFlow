using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.StudentId).IsRequired();
        builder.Property(r => r.Comment).IsRequired().HasMaxLength(2000);
        builder.HasIndex(r => new { r.StudentId, r.CourseId }).IsUnique();
    }
}
