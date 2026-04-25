namespace Ims.YamiFlow.Domain.Interfaces.Services;

public record AuthTokens(string AccessToken, string RefreshToken, DateTime AccessTokenExpiry);
