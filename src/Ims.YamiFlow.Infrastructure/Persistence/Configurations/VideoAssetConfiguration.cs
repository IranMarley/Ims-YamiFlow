using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class VideoAssetConfiguration : IEntityTypeConfiguration<VideoAsset>
{
    public void Configure(EntityTypeBuilder<VideoAsset> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.HlsManifestPath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.ThumbnailPath).HasMaxLength(500);
        builder.Property(x => x.Mp4Path360).HasMaxLength(500);
        builder.Property(x => x.Mp4Path720).HasMaxLength(500);
        builder.Property(x => x.Mp4Path1080).HasMaxLength(500);

        builder.HasIndex(x => x.LessonId).IsUnique();
    }
}
