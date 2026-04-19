using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Application.IAM.Commands.Permissions;

public record AddPermissionCommand(string RoleId, string Resource, string Operation);

public class AddPermissionValidator : AbstractValidator<AddPermissionCommand>
{
    public AddPermissionValidator()
    {
        RuleFor(x => x.RoleId).NotEmpty();
        RuleFor(x => x.Resource)
            .NotEmpty()
            .Must(r => Resources.All.Contains(r))
            .WithMessage($"Invalid resource. Accepted: {string.Join(", ", Resources.All)}");
        RuleFor(x => x.Operation)
            .NotEmpty()
            .Must(o => Operations.All.Contains(o))
            .WithMessage($"Invalid operation. Accepted: {string.Join(", ", Operations.All)}");
    }
}

public class AddPermissionHandler(IIamService iamService) : IHandler<AddPermissionCommand, Result>
{
    public async Task<Result> Handle(AddPermissionCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.AddPermissionAsync(cmd.RoleId, cmd.Resource, cmd.Operation, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
