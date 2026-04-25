using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IForumPostRepository
{
    Task<ForumPost?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ForumPost post, CancellationToken ct = default);
    void Remove(ForumPost post);
}
