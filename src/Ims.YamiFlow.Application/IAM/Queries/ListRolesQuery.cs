using Ims.YamiFlow.Application.Common;

using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.IAM.Queries;

public record ListRolesQuery;

public record RoleResponse(string Id, string Name, string? Description);

public class ListRolesHandler(IIamService iamService)
    : IHandler<ListRolesQuery, Result<List<RoleResponse>>>
{
    public async Task<Result<List<RoleResponse>>> Handle(ListRolesQuery q, CancellationToken ct)
    {
        var roles = await iamService.ListRolesAsync(ct);
        return Result.Success(roles.Select(r => new RoleResponse(r.Id, r.Name, r.Description)).ToList());
    }
}
