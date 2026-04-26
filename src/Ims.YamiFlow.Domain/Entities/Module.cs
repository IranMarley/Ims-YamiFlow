namespace Ims.YamiFlow.Domain.Entities;

public class Module
{
    public Guid Id { get; private set; }
    public Guid CourseId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public int Order { get; private set; }

    private readonly List<Lesson> _lessons = [];
    public IReadOnlyCollection<Lesson> Lessons => _lessons.AsReadOnly();

    private Module() { }

    public static Module Create(Guid courseId, string title, int order)
        => new() { Id = Guid.NewGuid(), CourseId = courseId, Title = title, Order = order };

    public Lesson AddLesson(string title, int order, string? contentUrl = null)
    {
        var lesson = Lesson.Create(Id, title, order, contentUrl);
        _lessons.Add(lesson);
        return lesson;
    }

    public void Reorder(int newOrder) => Order = newOrder;

    public void UpdateTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Module title cannot be empty.");

        Title = title;
    }

    public void RemoveLesson(Guid lessonId)
    {
        var lesson = _lessons.FirstOrDefault(l => l.Id == lessonId)
            ?? throw new DomainException("Lesson not found in this module.");
        _lessons.Remove(lesson);
    }

    public Lesson? FindLesson(Guid lessonId)
        => _lessons.FirstOrDefault(l => l.Id == lessonId);
}
