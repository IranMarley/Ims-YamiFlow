using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Application.IAM.Commands.Roles;

public record UpdateRoleCommand(string RoleId, string Description);

public class UpdateRoleValidator : AbstractValidator<UpdateRoleCommand>
{
    public UpdateRoleValidator()
    {
        RuleFor(x => x.RoleId).NotEmpty();
        RuleFor(x => x.Description).MaximumLength(255);
    }
}

public class UpdateRoleHandler(IIamService iamService) : IHandler<UpdateRoleCommand, Result>
{
    public async Task<Result> Handle(UpdateRoleCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.UpdateRoleAsync(cmd.RoleId, cmd.Description, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
