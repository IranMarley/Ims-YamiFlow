using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.IAM.Queries;

public record ListRolesQuery : IRequest<Result<List<RoleResponse>>>;

public record RoleResponse(string Id, string Name, string? Description);

public class ListRolesHandler(IIamService iamService)
    : IRequestHandler<ListRolesQuery, Result<List<RoleResponse>>>
{
    public async Task<Result<List<RoleResponse>>> Handle(ListRolesQuery q, CancellationToken ct)
    {
        var roles = await iamService.ListRolesAsync(ct);
        return Result.Success(roles.Select(r => new RoleResponse(r.Id, r.Name, r.Description)).ToList());
    }
}
