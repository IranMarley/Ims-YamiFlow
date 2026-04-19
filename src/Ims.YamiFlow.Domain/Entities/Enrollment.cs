namespace Ims.YamiFlow.Domain.Entities;

public class Enrollment
{
    public Guid Id { get; private set; }
    public string StudentId { get; private set; } = string.Empty;
    public Guid CourseId { get; private set; }
    public EnrollmentStatus Status { get; private set; }
    public DateTime EnrolledAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    private readonly List<LessonProgress> _progress = [];
    public IReadOnlyCollection<LessonProgress> Progress => _progress.AsReadOnly();

    private Enrollment() { }

    public static Enrollment Create(string studentId, Guid courseId)
        => new()
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            CourseId = courseId,
            Status = EnrollmentStatus.Active,
            EnrolledAt = DateTime.UtcNow
        };

    public void CompleteLesson(Guid lessonId)
    {
        if (Status != EnrollmentStatus.Active)
            throw new DomainException("Enrollment is not active.");

        if (_progress.Any(p => p.LessonId == lessonId))
            return; // already completed, idempotent

        _progress.Add(LessonProgress.Create(Id, lessonId));
    }

    public decimal CalculateProgress(int totalLessons)
    {
        if (totalLessons == 0) return 0;
        return Math.Round((decimal)_progress.Count / totalLessons * 100, 2);
    }

    public bool IsEligibleForCertificate(int totalLessons)
        => CalculateProgress(totalLessons) >= 100;

    public void AddOrUpdateProgress(Guid lessonId, int watchedSeconds)
    {
        if (Status != EnrollmentStatus.Active)
            throw new DomainException("Enrollment is not active.");

        var existing = _progress.FirstOrDefault(p => p.LessonId == lessonId);
        if (existing is not null)
            existing.UpdateWatchedSeconds(watchedSeconds);
        else
            _progress.Add(LessonProgress.Create(Id, lessonId, watchedSeconds));
    }

    public void Complete()
    {
        Status = EnrollmentStatus.Completed;
        CompletedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        if (Status == EnrollmentStatus.Completed)
            throw new DomainException("Completed enrollment cannot be cancelled.");

        Status = EnrollmentStatus.Cancelled;
    }
}
