using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface ICourseRepository
{
    Task<Course?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Course?> GetByIdWithModulesAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Course course, CancellationToken ct = default);
    void Update(Course course);
    void AddModule(Module module);
    void AddLesson(Lesson lesson);
    void RemoveModule(Module module);
    void RemoveLesson(Lesson lesson);
}
