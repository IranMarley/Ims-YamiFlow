using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Application.IAM.Commands.Roles;

public record DeleteRoleCommand(string RoleId);

public class DeleteRoleHandler(IIamService iamService) : IHandler<DeleteRoleCommand, Result>
{
    public async Task<Result> Handle(DeleteRoleCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.DeleteRoleAsync(cmd.RoleId, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
