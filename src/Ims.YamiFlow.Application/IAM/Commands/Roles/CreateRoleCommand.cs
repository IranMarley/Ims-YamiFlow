using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Application.IAM.Commands.Roles;

public record CreateRoleCommand(string Name, string Description);

public class CreateRoleValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(255);
    }
}

public class CreateRoleHandler(IIamService iamService) : IHandler<CreateRoleCommand, Result>
{
    public async Task<Result> Handle(CreateRoleCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await iamService.CreateRoleAsync(cmd.Name, cmd.Description, ct);
        return succeeded ? Result.Success() : Result.Failure(string.Join(", ", errors));
    }
}
