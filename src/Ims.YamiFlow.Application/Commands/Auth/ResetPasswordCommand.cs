using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record ResetPasswordCommand(string Email, string Token, string NewPassword);

// ── Validator ─────────────────────────────────────────
public class ResetPasswordValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
    }
}

// ── Handler ───────────────────────────────────────────
public class ResetPasswordHandler(IAuthUserService authUserService)
    : IHandler<ResetPasswordCommand, Result>
{
    public async Task<Result> Handle(ResetPasswordCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await authUserService.ResetPasswordAsync(cmd.Email, cmd.Token, cmd.NewPassword, ct);
        return succeeded
            ? Result.Success()
            : Result.Failure(string.Join(", ", errors));
    }
}
