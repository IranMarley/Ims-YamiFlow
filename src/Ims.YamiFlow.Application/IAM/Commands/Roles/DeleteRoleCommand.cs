using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.IAM.Commands.Roles;

public record DeleteRoleCommand(string RoleId) : IRequest<Result>;

public class DeleteRoleHandler(IIamService iamService) : IRequestHandler<DeleteRoleCommand, Result>
{
    public async Task<Result> Handle(DeleteRoleCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.DeleteRoleAsync(cmd.RoleId, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
