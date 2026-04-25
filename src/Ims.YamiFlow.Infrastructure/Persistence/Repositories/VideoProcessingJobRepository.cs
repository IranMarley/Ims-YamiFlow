using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class VideoProcessingJobRepository(AppDbContext db) : IVideoProcessingJobRepository
{
    public async Task<VideoProcessingJob?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.VideoProcessingJobs.FindAsync([id], ct);

    public async Task AddAsync(VideoProcessingJob job, CancellationToken ct = default)
        => await db.VideoProcessingJobs.AddAsync(job, ct);

    public void Update(VideoProcessingJob job)
        => db.VideoProcessingJobs.Update(job);
}
