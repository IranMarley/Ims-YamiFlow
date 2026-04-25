using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Admin;

// ── Command ───────────────────────────────────────────
public record ToggleUserStatusCommand(string UserId, bool IsActive);

public class ToggleUserStatusValidator : AbstractValidator<ToggleUserStatusCommand>
{
    public ToggleUserStatusValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class ToggleUserStatusHandler(IAuthUserService authUserService)
    : IHandler<ToggleUserStatusCommand, Result>
{
    public async Task<Result> Handle(ToggleUserStatusCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await authUserService.ToggleActiveAsync(cmd.UserId, cmd.IsActive, ct);
        return succeeded
            ? Result.Success()
            : Result.Failure(string.Join(", ", errors));
    }
}
