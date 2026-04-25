using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class CourseRepository(AppDbContext db) : ICourseRepository
{
    public async Task<Course?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Courses.FindAsync([id], ct);

    public async Task<Course?> GetByIdWithModulesAsync(Guid id, CancellationToken ct = default)
        => await db.Courses
            .Include(c => c.Modules)
            .ThenInclude(m => m.Lessons)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(Course course, CancellationToken ct = default)
        => await db.Courses.AddAsync(course, ct);

    public void Update(Course course)
        => db.Courses.Update(course);

    public void AddModule(Module module)
        => db.Modules.Add(module);

    public void AddLesson(Lesson lesson)
        => db.Lessons.Add(lesson);

    public void RemoveModule(Module module)
        => db.Modules.Remove(module);

    public void RemoveLesson(Lesson lesson)
        => db.Lessons.Remove(lesson);
}
