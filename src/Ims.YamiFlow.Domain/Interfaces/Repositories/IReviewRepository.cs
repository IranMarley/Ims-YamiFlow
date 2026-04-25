using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Review?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default);
    Task AddAsync(Review review, CancellationToken ct = default);
    void Update(Review review);
    void Remove(Review review);
}
