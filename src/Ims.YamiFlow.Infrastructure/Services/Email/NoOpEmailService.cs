using Ims.YamiFlow.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Infrastructure.Services.Email;

/// <summary>
/// No-op email service. Replace with SendGrid / SMTP implementation.
/// </summary>
public class NoOpEmailService(ILogger<NoOpEmailService> logger) : IEmailService
{
    public Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        logger.LogInformation("[Email] To: {To} | Subject: {Subject}", to, subject);
        return Task.CompletedTask;
    }
}
