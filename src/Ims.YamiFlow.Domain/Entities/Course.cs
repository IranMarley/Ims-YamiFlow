namespace Ims.YamiFlow.Domain.Entities;

public class Course
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string? Thumbnail { get; private set; }
    public bool IsFree { get; private set; }
    public CourseLevel Level { get; private set; }
    public CourseStatus Status { get; private set; }
    public string InstructorId { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime? PublishedAt { get; private set; }

    private readonly List<Module> _modules = [];
    public IReadOnlyCollection<Module> Modules => _modules.AsReadOnly();

    private readonly List<string> _tags = [];
    public IReadOnlyCollection<string> Tags => _tags.AsReadOnly();

    private Course() { }

    public static Course Create(string title, string description, CourseLevel level,
        string instructorId, bool isFree = false)
    {
        return new Course
        {
            Id = Guid.NewGuid(),
            Title = title,
            Slug = GenerateSlug(title),
            Description = description,
            IsFree = isFree,
            Level = level,
            InstructorId = instructorId,
            Status = CourseStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
    }

    public Module AddModule(string title, int order)
    {
        var module = Module.Create(Id, title, order);
        _modules.Add(module);
        return module;
    }

    public void Publish()
    {
        if (_modules.Count == 0)
            throw new DomainException("Course must have at least one module.");

        if (_modules.Any(m => m.Lessons.Count == 0))
            throw new DomainException("All modules must have at least one lesson.");

        Status = CourseStatus.Published;
        PublishedAt = DateTime.UtcNow;
    }

    public void Archive()
    {
        if (Status != CourseStatus.Published)
            throw new DomainException("Apenas cursos publicados podem ser arquivados.");

        Status = CourseStatus.Archived;
    }

    public void Update(string title, string description, CourseLevel level, bool isFree)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Course title cannot be empty.");

        Title = title;
        Slug = GenerateSlug(title);
        Description = description;
        Level = level;
        IsFree = isFree;
    }

    public void RemoveModule(Guid moduleId)
    {
        var module = _modules.FirstOrDefault(m => m.Id == moduleId)
            ?? throw new DomainException("Module not found in this course.");
        _modules.Remove(module);
    }

    public Module? FindModule(Guid moduleId)
        => _modules.FirstOrDefault(m => m.Id == moduleId);

    public bool IsPublished => Status == CourseStatus.Published;

    public TimeSpan TotalDuration()
        => TimeSpan.FromSeconds(_modules
            .SelectMany(m => m.Lessons)
            .Sum(l => l.DurationSeconds));

    private static string GenerateSlug(string title)
        => title.ToLower()
            .Replace(" ", "-")
            .Replace("ã", "a").Replace("ç", "c")
            .Replace("é", "e").Replace("ê", "e")
            .Replace("ó", "o").Replace("ô", "o");
}
