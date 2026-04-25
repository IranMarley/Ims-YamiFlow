namespace Ims.YamiFlow.Domain.Interfaces.Services;

public interface ITokenService
{
    Task<AuthTokens> GenerateTokensAsync(string userId);
    Task<AuthTokens?> RefreshAsync(string refreshToken);
    Task RevokeAsync(string userId);
}
