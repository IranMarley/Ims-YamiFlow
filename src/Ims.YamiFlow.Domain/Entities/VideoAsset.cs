namespace Ims.YamiFlow.Domain.Entities;

public sealed class VideoAsset
{
    public Guid Id { get; private set; }
    public Guid LessonId { get; private set; }
    public string HlsManifestPath { get; private set; } = string.Empty;
    public string? ThumbnailPath { get; private set; }
    public string? Mp4Path360 { get; private set; }
    public string? Mp4Path720 { get; private set; }
    public string? Mp4Path1080 { get; private set; }
    public int DurationSeconds { get; private set; }
    public long FileSizeBytes { get; private set; }
    public DateTime ProcessedAt { get; private set; }

    private VideoAsset() { }

    public static VideoAsset Create(
        Guid lessonId,
        string hlsManifestPath,
        string? thumbnailPath,
        int durationSeconds,
        long fileSizeBytes) => new()
    {
        Id = Guid.NewGuid(),
        LessonId = lessonId,
        HlsManifestPath = hlsManifestPath,
        ThumbnailPath = thumbnailPath,
        DurationSeconds = durationSeconds,
        FileSizeBytes = fileSizeBytes,
        ProcessedAt = DateTime.UtcNow
    };
}
