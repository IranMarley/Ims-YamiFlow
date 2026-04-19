namespace Ims.YamiFlow.Domain.Entities;

public class LessonProgress
{
    public Guid EnrollmentId { get; private set; }
    public Guid LessonId { get; private set; }
    public DateTime CompletedAt { get; private set; }
    public int WatchedSeconds { get; private set; }

    private LessonProgress() { }

    public static LessonProgress Create(Guid enrollmentId, Guid lessonId, int watchedSeconds = 0)
        => new()
        {
            EnrollmentId = enrollmentId,
            LessonId = lessonId,
            CompletedAt = DateTime.UtcNow,
            WatchedSeconds = watchedSeconds
        };

    public void UpdateWatchedSeconds(int seconds) => WatchedSeconds = seconds;
}
