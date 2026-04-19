namespace Ims.YamiFlow.Domain.Entities;

public class Course
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string? Thumbnail { get; private set; }
    public decimal Price { get; private set; }
    public CourseLevel Level { get; private set; }
    public CourseStatus Status { get; private set; }
    public string InstructorId { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public decimal? PromotionalPrice { get; private set; }
    public DateTime? PromotionExpiresAt { get; private set; }

    private readonly List<Module> _modules = [];
    public IReadOnlyCollection<Module> Modules => _modules.AsReadOnly();

    private readonly List<string> _tags = [];
    public IReadOnlyCollection<string> Tags => _tags.AsReadOnly();

    private Course() { }

    public static Course Create(string title, string description, decimal price,
        CourseLevel level, string instructorId)
    {
        return new Course
        {
            Id = Guid.NewGuid(),
            Title = title,
            Slug = GenerateSlug(title),
            Description = description,
            Price = price,
            Level = level,
            InstructorId = instructorId,
            Status = CourseStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void AddModule(string title, int order)
    {
        var module = Module.Create(Id, title, order);
        _modules.Add(module);
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

    public void Update(string title, string description, decimal price, CourseLevel level)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Course title cannot be empty.");
        if (price < 0)
            throw new DomainException("Price cannot be negative.");

        Title = title;
        Slug = GenerateSlug(title);
        Description = description;
        Price = price;
        Level = level;
    }

    public void SetPromotion(decimal promotionalPrice, DateTime expiresAt)
    {
        if (promotionalPrice < 0)
            throw new DomainException("Promotional price cannot be negative.");
        if (promotionalPrice >= Price)
            throw new DomainException("Promotional price must be less than the regular price.");
        if (expiresAt <= DateTime.UtcNow)
            throw new DomainException("Promotion expiry date must be in the future.");

        PromotionalPrice = promotionalPrice;
        PromotionExpiresAt = expiresAt;
    }

    public void ClearPromotion()
    {
        PromotionalPrice = null;
        PromotionExpiresAt = null;
    }

    public decimal EffectivePrice =>
        PromotionalPrice.HasValue && PromotionExpiresAt.HasValue && PromotionExpiresAt > DateTime.UtcNow
            ? PromotionalPrice.Value
            : Price;

    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice < 0)
            throw new DomainException("Price cannot be negative.");

        Price = newPrice;
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
