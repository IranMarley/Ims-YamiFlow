using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record ConfirmEmailCommand(string Email, string Token) : IRequest<Result>;

// ── Validator ─────────────────────────────────────────
public class ConfirmEmailValidator : AbstractValidator<ConfirmEmailCommand>
{
    public ConfirmEmailValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty();
    }
}

// ── Handler ───────────────────────────────────────────
public class ConfirmEmailHandler(IAuthUserService authUserService)
    : IRequestHandler<ConfirmEmailCommand, Result>
{
    public async Task<Result> Handle(ConfirmEmailCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await authUserService.ConfirmEmailAsync(cmd.Email, cmd.Token, ct);
        return succeeded
            ? Result.Success()
            : Result.Failure(string.Join(", ", errors));
    }
}
