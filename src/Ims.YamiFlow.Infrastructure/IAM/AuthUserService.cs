using Ims.YamiFlow.Domain.Dtos;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.AspNetCore.Identity;

namespace Ims.YamiFlow.Infrastructure.IAM;

public class AuthUserService(UserManager<AppUser> userManager) : IAuthUserService
{
    public async Task<AppUserDto?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        return user is null ? null : new AppUserDto(user.Id, user.Email!, user.FullName, user.IsActive, user.EmailConfirmed);
    }

    public async Task<AppUserDto?> FindByIdAsync(string userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is null ? null : new AppUserDto(user.Id, user.Email!, user.FullName, user.IsActive, user.EmailConfirmed);
    }

    public async Task<(bool Succeeded, string[] Errors)> CreateAsync(
        string email, string fullName, string password, CancellationToken ct = default)
    {
        var user = new AppUser { UserName = email, Email = email, FullName = fullName };
        var result = await userManager.CreateAsync(user, password);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> CreateExternalUserAsync(
        string email, string fullName, CancellationToken ct = default)
    {
        var user = new AppUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(user);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<bool> CheckPasswordAsync(string email, string password, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        return user is not null && await userManager.CheckPasswordAsync(user, password);
    }

    public async Task AddToRoleAsync(string userId, string role, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is not null)
            await userManager.AddToRoleAsync(user, role);
    }

    public async Task<IReadOnlyList<string>> GetRolesAsync(string userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return [];
        return (await userManager.GetRolesAsync(user)).ToList();
    }

    public async Task<string> GenerateEmailConfirmationTokenAsync(string userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is null ? string.Empty : await userManager.GenerateEmailConfirmationTokenAsync(user);
    }

    public async Task<string> GeneratePasswordResetTokenAsync(string email, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        return user is null ? string.Empty : await userManager.GeneratePasswordResetTokenAsync(user);
    }

    public async Task<(bool Succeeded, string[] Errors)> ResetPasswordAsync(
        string email, string token, string newPassword, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
            return (false, ["User not found."]);

        var result = await userManager.ResetPasswordAsync(user, token, newPassword);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> ChangePasswordAsync(
        string userId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return (false, ["User not found."]);

        var result = await userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> ConfirmEmailAsync(
        string email, string token, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
            return (false, ["User not found."]);

        var result = await userManager.ConfirmEmailAsync(user, token);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> ToggleActiveAsync(
        string userId, bool isActive, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return (false, ["User not found."]);

        user.IsActive = isActive;
        var result = await userManager.UpdateAsync(user);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> UpdateProfileAsync(
        string userId, string fullName, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return (false, ["User not found."]);

        user.FullName = fullName;
        var result = await userManager.UpdateAsync(user);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> ForceConfirmEmailAsync(
        string userId, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return (false, ["User not found."]);

        user.EmailConfirmed = true;
        var result = await userManager.UpdateAsync(user);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }
}
