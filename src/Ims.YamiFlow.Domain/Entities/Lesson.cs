namespace Ims.YamiFlow.Domain.Entities;

public class Lesson
{
    public Guid Id { get; private set; }
    public Guid ModuleId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public int Order { get; private set; }
    public LessonType Type { get; private set; }
    public int DurationSeconds { get; private set; }
    public string? ContentUrl { get; private set; }
    public bool IsFreePreview { get; private set; }

    private Lesson() { }

    public static Lesson Create(Guid moduleId, string title, LessonType type,
        int durationSeconds, int order, string? contentUrl)
        => new()
        {
            Id = Guid.NewGuid(),
            ModuleId = moduleId,
            Title = title,
            Type = type,
            DurationSeconds = durationSeconds,
            Order = order,
            ContentUrl = contentUrl
        };

    public void MakeFreePreview() => IsFreePreview = true;
    public void RemoveFreePreview() => IsFreePreview = false;
    public void Reorder(int newOrder) => Order = newOrder;

    public void ChangeModule(Guid newModuleId, int newOrder)
    {
        ModuleId = newModuleId;
        Order = newOrder;
    }

    public void UpdateContent(string? contentUrl, int durationSeconds)
    {
        ContentUrl = contentUrl;
        DurationSeconds = durationSeconds;
    }

    public void Update(string title, LessonType type, int durationSeconds, string? contentUrl, bool isFreePreview)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Lesson title cannot be empty.");

        Title = title;
        Type = type;
        DurationSeconds = durationSeconds;
        ContentUrl = contentUrl;
        IsFreePreview = isFreePreview;
    }
}
