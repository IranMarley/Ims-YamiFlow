namespace Ims.YamiFlow.Domain.Entities;

public class AuditLog
{
    public long Id { get; private set; }
    public string Source { get; private set; } = string.Empty;
    public string? EntityName { get; private set; }
    public string? Action { get; private set; }
    public string? UserId { get; private set; }
    public string? UserName { get; private set; }
    public string? IpAddress { get; private set; }
    public Guid TransactionId { get; private set; }
    public string Data { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private AuditLog() { }

    public static AuditLog Create(
        string source,
        string? entityName,
        string? action,
        string? userId,
        string? userName,
        string? ipAddress,
        Guid transactionId,
        string data)
    {
        return new AuditLog
        {
            Source = source,
            EntityName = entityName,
            Action = action,
            UserId = userId,
            UserName = userName,
            IpAddress = ipAddress,
            TransactionId = transactionId,
            Data = data,
            CreatedAt = DateTime.UtcNow
        };
    }
}
