using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Application.IAM.Commands.Permissions;

public record RemovePermissionCommand(string RoleId, string Resource, string Operation);

public class RemovePermissionHandler(IIamService iamService) : IHandler<RemovePermissionCommand, Result>
{
    public async Task<Result> Handle(RemovePermissionCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.RemovePermissionAsync(cmd.RoleId, cmd.Resource, cmd.Operation, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
