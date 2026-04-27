using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Admin;

public record ConfirmUserEmailCommand(string UserId);

public class ConfirmUserEmailValidator : AbstractValidator<ConfirmUserEmailCommand>
{
    public ConfirmUserEmailValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class ConfirmUserEmailHandler(IAuthUserService authUserService)
    : IHandler<ConfirmUserEmailCommand, Result>
{
    public async Task<Result> Handle(ConfirmUserEmailCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await authUserService.ForceConfirmEmailAsync(cmd.UserId, ct);
        return succeeded
            ? Result.Success()
            : Result.Failure(string.Join(", ", errors));
    }
}
