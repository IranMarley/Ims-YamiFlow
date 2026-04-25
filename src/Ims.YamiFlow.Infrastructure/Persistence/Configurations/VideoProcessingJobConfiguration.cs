using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class VideoProcessingJobConfiguration : IEntityTypeConfiguration<VideoProcessingJob>
{
    public void Configure(EntityTypeBuilder<VideoProcessingJob> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.RawFilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.ErrorMessage)
            .HasMaxLength(2000);

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.HasIndex(x => x.LessonId);
    }
}
