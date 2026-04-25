using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class VideoAssetRepository(AppDbContext db) : IVideoAssetRepository
{
    public async Task<VideoAsset?> GetByLessonIdAsync(Guid lessonId, CancellationToken ct = default)
        => await db.VideoAssets.FirstOrDefaultAsync(a => a.LessonId == lessonId, ct);

    public async Task AddAsync(VideoAsset asset, CancellationToken ct = default)
        => await db.VideoAssets.AddAsync(asset, ct);

    public void Update(VideoAsset asset)
        => db.VideoAssets.Update(asset);
}
