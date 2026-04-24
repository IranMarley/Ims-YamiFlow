namespace Ims.YamiFlow.Domain.Entities;

public class OutboxMessage
{
    public Guid Id { get; private set; }
    public string Type { get; private set; } = default!;
    public string Payload { get; private set; } = default!;
    public string Status { get; private set; } = OutboxStatus.Pending;
    public DateTime CreatedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }

    private OutboxMessage() { }

    public static OutboxMessage Create(string type, string payload) => new()
    {
        Id = Guid.NewGuid(),
        Type = type,
        Payload = payload,
        Status = OutboxStatus.Pending,
        CreatedAt = DateTime.UtcNow
    };

    public void MarkProcessing()
        => Status = OutboxStatus.Processing;

    public void MarkProcessed()
    {
        Status = OutboxStatus.Processed;
        ProcessedAt = DateTime.UtcNow;
    }

    public void MarkFailed()
        => Status = OutboxStatus.Failed;
}

public static class OutboxStatus
{
    public const string Pending = "Pending";
    public const string Processing = "Processing";
    public const string Processed = "Processed";
    public const string Failed = "Failed";
}
