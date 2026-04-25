using Ims.YamiFlow.Domain.Dtos;

namespace Ims.YamiFlow.Domain.Interfaces.Services;

public interface IIamService
{
    // Roles
    Task<List<RoleDto>> ListRolesAsync(CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> CreateRoleAsync(string name, string description, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> UpdateRoleAsync(string roleId, string description, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> DeleteRoleAsync(string roleId, CancellationToken ct = default);

    // Permissions
    Task<(bool Found, List<RolePermissionDto> Permissions)> GetRolePermissionsAsync(string roleId, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> AddPermissionAsync(string roleId, string resource, string operation, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> RemovePermissionAsync(string roleId, string resource, string operation, CancellationToken ct = default);

    // User roles
    Task<(bool Succeeded, string[] Errors)> AssignRoleAsync(string userId, string roleName, CancellationToken ct = default);
    Task<(bool Succeeded, string[] Errors)> RemoveRoleAsync(string userId, string roleName, CancellationToken ct = default);
}
