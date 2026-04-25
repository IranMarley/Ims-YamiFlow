using Ims.YamiFlow.Domain.Enums;

namespace Ims.YamiFlow.Domain.Entities;

public sealed class VideoProcessingJob
{
    public Guid Id { get; private set; }
    public Guid LessonId { get; private set; }
    public Guid CourseId { get; private set; }
    public string RawFilePath { get; private set; } = string.Empty;
    public string Status { get; private set; } = VideoJobStatus.Pending;
    public int RetryCount { get; private set; }
    public string? ErrorMessage { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    private VideoProcessingJob() { }

    public static VideoProcessingJob Create(Guid lessonId, Guid courseId, string rawFilePath) => new()
    {
        Id = Guid.NewGuid(),
        LessonId = lessonId,
        CourseId = courseId,
        RawFilePath = rawFilePath,
        Status = VideoJobStatus.Pending,
        CreatedAt = DateTime.UtcNow
    };

    public void MarkProcessing()
    {
        Status = VideoJobStatus.Processing;
        StartedAt = DateTime.UtcNow;
    }

    public void MarkCompleted()
    {
        Status = VideoJobStatus.Completed;
        CompletedAt = DateTime.UtcNow;
    }

    public void MarkFailed(string error)
    {
        RetryCount++;
        ErrorMessage = error;
        Status = RetryCount >= 3 ? VideoJobStatus.Dead : VideoJobStatus.Pending;
        StartedAt = null;
    }
}
