using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class EnrollmentRepository(AppDbContext db) : IEnrollmentRepository
{
    public async Task<Enrollment?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Enrollments
            .Include(e => e.Progress)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<Enrollment?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default)
        => await db.Enrollments
            .Include(e => e.Progress)
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId, ct);

    public async Task<bool> ExistsAsync(string studentId, Guid courseId, CancellationToken ct = default)
        => await db.Enrollments.AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId, ct);

    public async Task AddAsync(Enrollment enrollment, CancellationToken ct = default)
        => await db.Enrollments.AddAsync(enrollment, ct);

    public void Update(Enrollment enrollment)
        => db.Enrollments.Update(enrollment);
}
