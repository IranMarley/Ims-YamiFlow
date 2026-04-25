using Ims.YamiFlow.Domain.Dtos;

namespace Ims.YamiFlow.Domain.Interfaces.Services;

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
