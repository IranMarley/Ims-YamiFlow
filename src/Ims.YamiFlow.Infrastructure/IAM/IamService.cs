using System.Security.Claims;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Domain.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.IAM;

public class IamService(
    RoleManager<AppRole> roleManager,
    UserManager<AppUser> userManager) : IIamService
{
    public async Task<List<RoleDto>> ListRolesAsync(CancellationToken ct = default)
    {
        var roles = await roleManager.Roles.ToListAsync(ct);
        return roles.Select(r => new RoleDto(r.Id, r.Name!, r.Description)).ToList();
    }

    public async Task<(bool Succeeded, string[] Errors)> CreateRoleAsync(
        string name, string description, CancellationToken ct = default)
    {
        if (await roleManager.RoleExistsAsync(name))
            return (false, ["A role with this name already exists."]);

        var role = new AppRole { Name = name, Description = description };
        var result = await roleManager.CreateAsync(role);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> UpdateRoleAsync(
        string roleId, string description, CancellationToken ct = default)
    {
        var role = await roleManager.FindByIdAsync(roleId);
        if (role is null) return (false, ["Role not found."]);

        role.Description = description;
        var result = await roleManager.UpdateAsync(role);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> DeleteRoleAsync(
        string roleId, CancellationToken ct = default)
    {
        var role = await roleManager.FindByIdAsync(roleId);
        if (role is null) return (false, ["Role not found."]);

        var result = await roleManager.DeleteAsync(role);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Found, List<RolePermissionDto> Permissions)> GetRolePermissionsAsync(
        string roleId, CancellationToken ct = default)
    {
        var role = await roleManager.FindByIdAsync(roleId);
        if (role is null) return (false, []);

        var claims = await roleManager.GetClaimsAsync(role);
        var permissions = claims
            .Where(c => Resources.All.Contains(c.Type))
            .Select(c => new RolePermissionDto(c.Type, c.Value))
            .ToList();

        return (true, permissions);
    }

    public async Task<(bool Succeeded, string[] Errors)> AddPermissionAsync(
        string roleId, string resource, string operation, CancellationToken ct = default)
    {
        var role = await roleManager.FindByIdAsync(roleId);
        if (role is null) return (false, ["Role not found."]);

        var existing = await roleManager.GetClaimsAsync(role);
        if (existing.Any(c => c.Type == resource && c.Value == operation))
            return (false, ["Permission already exists on this role."]);

        var result = await roleManager.AddClaimAsync(role, new Claim(resource, operation));
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> RemovePermissionAsync(
        string roleId, string resource, string operation, CancellationToken ct = default)
    {
        var role = await roleManager.FindByIdAsync(roleId);
        if (role is null) return (false, ["Role not found."]);

        var existing = await roleManager.GetClaimsAsync(role);
        var claim = existing.FirstOrDefault(c => c.Type == resource && c.Value == operation);
        if (claim is null) return (false, ["Permission not found on this role."]);

        var result = await roleManager.RemoveClaimAsync(role, claim);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> AssignRoleAsync(
        string userId, string roleName, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return (false, ["User not found."]);

        var currentRoles = await userManager.GetRolesAsync(user);
        if (currentRoles.Any())
            await userManager.RemoveFromRolesAsync(user, currentRoles);

        var result = await userManager.AddToRoleAsync(user, roleName);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Succeeded, string[] Errors)> RemoveRoleAsync(
        string userId, string roleName, CancellationToken ct = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return (false, ["User not found."]);

        var result = await userManager.RemoveFromRoleAsync(user, roleName);
        return (result.Succeeded, result.Errors.Select(e => e.Description).ToArray());
    }
}
