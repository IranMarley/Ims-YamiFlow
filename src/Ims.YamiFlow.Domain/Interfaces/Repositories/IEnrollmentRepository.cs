using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IEnrollmentRepository
{
    Task<Enrollment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Enrollment?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default);
    Task<bool> ExistsAsync(string studentId, Guid courseId, CancellationToken ct = default);
    Task AddAsync(Enrollment enrollment, CancellationToken ct = default);
    void Update(Enrollment enrollment);
}
