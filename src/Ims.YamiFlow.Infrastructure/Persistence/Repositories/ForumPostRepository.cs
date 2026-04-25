using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class ForumPostRepository(AppDbContext db) : IForumPostRepository
{
    public async Task<ForumPost?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.ForumPosts
            .Include(p => p.Replies)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(ForumPost post, CancellationToken ct = default)
        => await db.ForumPosts.AddAsync(post, ct);

    public void Remove(ForumPost post)
        => db.ForumPosts.Remove(post);
}
