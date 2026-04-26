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

    public void UpdatePaths(
        string hlsManifestPath,
        string? thumbnailPath,
        string? mp4Path360,
        string? mp4Path720,
        string? mp4Path1080,
        int durationSeconds,
        long fileSizeBytes)
    {
        HlsManifestPath = hlsManifestPath;
        ThumbnailPath = thumbnailPath;
        Mp4Path360 = mp4Path360;
        Mp4Path720 = mp4Path720;
        Mp4Path1080 = mp4Path1080;
        DurationSeconds = durationSeconds;
        FileSizeBytes = fileSizeBytes;
        ProcessedAt = DateTime.UtcNow;
    }

    public static VideoAsset Create(
        Guid lessonId,
        string hlsManifestPath,
        string? thumbnailPath,
        string? mp4Path360,
        string? mp4Path720,
        string? mp4Path1080,
        int durationSeconds,
        long fileSizeBytes) => new()
    {
        Id = Guid.NewGuid(),
        LessonId = lessonId,
        HlsManifestPath = hlsManifestPath,
        ThumbnailPath = thumbnailPath,
        Mp4Path360 = mp4Path360,
        Mp4Path720 = mp4Path720,
        Mp4Path1080 = mp4Path1080,
        DurationSeconds = durationSeconds,
        FileSizeBytes = fileSizeBytes,
        ProcessedAt = DateTime.UtcNow
    };
}
