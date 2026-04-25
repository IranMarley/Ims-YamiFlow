namespace Ims.YamiFlow.Domain.Interfaces.Services;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct = default);
}
