namespace Ims.YamiFlow.Domain.Entities;

public class Review
{
    public Guid Id { get; private set; }
    public Guid CourseId { get; private set; }
    public string StudentId { get; private set; } = string.Empty;
    public int Rating { get; private set; }
    public string Comment { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private Review() { }

    public static Review Create(Guid courseId, string studentId, int rating, string comment)
        => new()
        {
            Id = Guid.NewGuid(),
            CourseId = courseId,
            StudentId = studentId,
            Rating = rating,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };

    public void Update(int rating, string comment)
    {
        Rating = rating;
        Comment = comment;
        UpdatedAt = DateTime.UtcNow;
    }
}
