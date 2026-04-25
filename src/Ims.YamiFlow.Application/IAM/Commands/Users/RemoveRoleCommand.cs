using Ims.YamiFlow.Application.Common;

using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.IAM.Commands.Users;

public record RemoveRoleCommand(string UserId, string RoleName);

public class RemoveRoleHandler(IIamService iamService) : IHandler<RemoveRoleCommand, Result>
{
    public async Task<Result> Handle(RemoveRoleCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.RemoveRoleAsync(cmd.UserId, cmd.RoleName, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
