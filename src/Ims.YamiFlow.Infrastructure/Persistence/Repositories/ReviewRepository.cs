using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class ReviewRepository(AppDbContext db) : IReviewRepository
{
    public async Task<Review?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Reviews.FindAsync([id], ct);

    public async Task<Review?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default)
        => await db.Reviews.FirstOrDefaultAsync(r => r.StudentId == studentId && r.CourseId == courseId, ct);

    public async Task AddAsync(Review review, CancellationToken ct = default)
        => await db.Reviews.AddAsync(review, ct);

    public void Update(Review review)
        => db.Reviews.Update(review);

    public void Remove(Review review)
        => db.Reviews.Remove(review);
}
