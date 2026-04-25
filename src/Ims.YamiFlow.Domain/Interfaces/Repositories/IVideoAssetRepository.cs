using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IVideoAssetRepository
{
    Task<VideoAsset?> GetByLessonIdAsync(Guid lessonId, CancellationToken ct = default);
    Task AddAsync(VideoAsset asset, CancellationToken ct = default);
    void Update(VideoAsset asset);
}
