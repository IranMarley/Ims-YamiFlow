using System.Net;
using System.Net.Mail;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ims.YamiFlow.Infrastructure.Services.Email;

public sealed class SmtpEmailService(
    IOptions<EmailOptions> options,
    ILogger<SmtpEmailService> logger) : IEmailService
{
    private readonly EmailOptions _opts = options.Value;

    public async Task SendAsync(string to, string subject, string body, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_opts.SmtpHost))
        {
            logger.LogWarning("[Email] SMTP not configured — skipping send to {To} | Subject: {Subject}", to, subject);
            return;
        }

#pragma warning disable SYSLIB0006 // SmtpClient obsolete warning — MailKit not in dependencies
        using var client = new SmtpClient(_opts.SmtpHost, _opts.SmtpPort)
        {
            Credentials = new NetworkCredential(_opts.SmtpUser, _opts.SmtpPass),
            EnableSsl = true,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_opts.From, _opts.FromName),
            To = { new MailAddress(to) },
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        await client.SendMailAsync(message, ct);
#pragma warning restore SYSLIB0006

        logger.LogInformation("[Email] Sent to {To} | Subject: {Subject}", to, subject);
    }
}
