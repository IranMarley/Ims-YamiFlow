namespace Ims.YamiFlow.Infrastructure.Services.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string From { get; init; } = string.Empty;
    public string FromName { get; init; } = "YamiFlow";
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; } = 587;
    public string SmtpUser { get; init; } = string.Empty;
    public string SmtpPass { get; init; } = string.Empty;
}
