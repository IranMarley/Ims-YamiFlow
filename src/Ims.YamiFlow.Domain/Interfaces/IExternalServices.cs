namespace Ims.YamiFlow.Domain.Interfaces;

public record AuthTokens(string AccessToken, string RefreshToken, DateTime AccessTokenExpiry);

public record AppUserDto(string Id, string Email, string FullName, bool IsActive, bool EmailConfirmed);

public interface IAuthUserService
{
    Task<AppUserDto?> FindByEmailAsync(string email, CancellationToken ct = default);
    Task<AppUserDto?> FindByIdAsync(string userId, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> CreateAsync(string email, string fullName, string password, CancellationToken ct = default);
    Task<bool> CheckPasswordAsync(string email, string password, CancellationToken ct = default);
    Task AddToRoleAsync(string userId, string role, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetRolesAsync(string userId, CancellationToken ct = default);
    Task<string> GenerateEmailConfirmationTokenAsync(string userId, CancellationToken ct = default);
    Task<string> GeneratePasswordResetTokenAsync(string email, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> ChangePasswordAsync(string userId, string currentPassword, string newPassword, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> ConfirmEmailAsync(string email, string token, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> ToggleActiveAsync(string userId, bool isActive, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> UpdateProfileAsync(string userId, string fullName, CancellationToken ct = default);
}

public interface IEmailService
{
    Task SendAsync(string to, string subject, string body, CancellationToken ct = default);
}

public interface IStorageService
{
    Task<string> UploadAsync(Stream file, string fileName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string fileUrl, CancellationToken ct = default);
}

public interface IVideoProcessor
{
    Task<string> ProcessAsync(string rawVideoUrl, CancellationToken ct = default);
}

public interface ITokenService
{
    Task<AuthTokens> GenerateTokensAsync(string userId);
    Task<AuthTokens?> RefreshAsync(string refreshToken);
    Task RevokeAsync(string userId);
}

public interface IOutboxService
{
    Task EnqueueAsync(string type, object payload, CancellationToken ct = default);
}
