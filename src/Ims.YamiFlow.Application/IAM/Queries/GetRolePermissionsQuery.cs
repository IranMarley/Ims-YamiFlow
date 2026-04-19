using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.IAM.Queries;

public record GetRolePermissionsQuery(string RoleId) : IRequest<Result<List<PermissionItem>>>;

public record PermissionItem(string Resource, string Operation);

public class GetRolePermissionsHandler(IIamService iamService)
    : IRequestHandler<GetRolePermissionsQuery, Result<List<PermissionItem>>>
{
    public async Task<Result<List<PermissionItem>>> Handle(GetRolePermissionsQuery q, CancellationToken ct)
    {
        var (found, permissions) = await iamService.GetRolePermissionsAsync(q.RoleId, ct);
        if (!found)
            return Result.Failure<List<PermissionItem>>("Role not found.");

        return Result.Success(permissions.Select(p => new PermissionItem(p.Resource, p.Operation)).ToList());
    }
}
