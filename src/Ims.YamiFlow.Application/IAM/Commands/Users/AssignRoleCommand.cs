using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Application.IAM.Commands.Users;

public record AssignRoleCommand(string UserId, string RoleName);

public class AssignRoleValidator : AbstractValidator<AssignRoleCommand>
{
    public AssignRoleValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.RoleName).NotEmpty();
    }
}

public class AssignRoleHandler(IIamService iamService) : IHandler<AssignRoleCommand, Result>
{
    public async Task<Result> Handle(AssignRoleCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.AssignRoleAsync(cmd.UserId, cmd.RoleName, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
