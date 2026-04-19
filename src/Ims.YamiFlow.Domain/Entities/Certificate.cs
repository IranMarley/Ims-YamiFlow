namespace Ims.YamiFlow.Domain.Entities;

public class Certificate
{
    public Guid Id { get; private set; }
    public Guid EnrollmentId { get; private set; }
    public string StudentId { get; private set; } = string.Empty;
    public Guid CourseId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public DateTime IssuedAt { get; private set; }

    private Certificate() { }

    public static Certificate Create(Guid enrollmentId, string studentId, Guid courseId)
        => new()
        {
            Id = Guid.NewGuid(),
            EnrollmentId = enrollmentId,
            StudentId = studentId,
            CourseId = courseId,
            Code = GenerateCode(),
            IssuedAt = DateTime.UtcNow
        };

    private static string GenerateCode()
        => Guid.NewGuid().ToString("N")[..12].ToUpper();
}
