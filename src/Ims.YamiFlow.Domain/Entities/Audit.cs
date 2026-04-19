namespace Ims.YamiFlow.Domain.Entities;

public class Audit
{
    public Guid Id { get; private set; }
    public string? UserId { get; private set; }
    public string Method { get; private set; } = string.Empty;
    public string Path { get; private set; } = string.Empty;
    public string? QueryString { get; private set; }
    public string? RequestBody { get; private set; }
    public string? ResponseBody { get; private set; }
    public int StatusCode { get; private set; }
    public long ElapsedMs { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Audit() { }

    public static Audit Create(
        string? userId,
        string method,
        string path,
        string? queryString,
        string? requestBody,
        string? responseBody,
        int statusCode,
        long elapsedMs,
        string? ipAddress,
        string? userAgent)
    {
        return new Audit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Method = method,
            Path = path,
            QueryString = queryString,
            RequestBody = requestBody,
            ResponseBody = responseBody,
            StatusCode = statusCode,
            ElapsedMs = elapsedMs,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        };
    }
}

