using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record ChangePasswordCommand(string UserId, string CurrentPassword, string NewPassword) : IRequest<Result>;

// ── Validator ─────────────────────────────────────────
public class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
    }
}

// ── Handler ───────────────────────────────────────────
public class ChangePasswordHandler(IAuthUserService authUserService)
    : IRequestHandler<ChangePasswordCommand, Result>
{
    public async Task<Result> Handle(ChangePasswordCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await authUserService.ChangePasswordAsync(
            cmd.UserId, cmd.CurrentPassword, cmd.NewPassword, ct);
        return succeeded
            ? Result.Success()
            : Result.Failure(string.Join(", ", errors));
    }
}
