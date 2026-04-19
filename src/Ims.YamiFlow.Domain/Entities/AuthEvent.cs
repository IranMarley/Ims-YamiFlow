namespace Ims.YamiFlow.Domain.Entities;

public class AuthEvent
{
    public long Id { get; private set; }
    public string EventType { get; private set; } = string.Empty;
    public string? UserId { get; private set; }
    public string? Email { get; private set; }
    public bool Success { get; private set; }
    public string? FailureReason { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public string? Location { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private AuthEvent() { }

    public static AuthEvent Create(
        string eventType,
        string? userId,
        string? email,
        bool success,
        string? failureReason,
        string? ipAddress,
        string? userAgent,
        string? location = null)
    {
        return new AuthEvent
        {
            EventType = eventType,
            UserId = userId,
            Email = email,
            Success = success,
            FailureReason = failureReason,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Location = location,
            CreatedAt = DateTime.UtcNow
        };
    }
}
