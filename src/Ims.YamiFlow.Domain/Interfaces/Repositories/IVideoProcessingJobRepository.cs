using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IVideoProcessingJobRepository
{
    Task<VideoProcessingJob?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(VideoProcessingJob job, CancellationToken ct = default);
    void Update(VideoProcessingJob job);
}
