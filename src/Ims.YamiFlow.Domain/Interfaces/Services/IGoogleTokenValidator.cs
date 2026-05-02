namespace Ims.YamiFlow.Domain.Interfaces.Services;

public record GoogleUserInfo(string Email, string Name, string? PictureUrl);

public interface IGoogleTokenValidator
{
    Task<GoogleUserInfo?> ValidateAsync(string idToken, CancellationToken ct = default);
}
