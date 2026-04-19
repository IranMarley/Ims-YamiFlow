using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record ForgotPasswordCommand(string Email) : IRequest<Result>;

// ── Validator ─────────────────────────────────────────
public class ForgotPasswordValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}

// ── Handler ───────────────────────────────────────────
public class ForgotPasswordHandler(
    IAuthUserService authUserService,
    IEmailService emailService)
    : IRequestHandler<ForgotPasswordCommand, Result>
{
    public async Task<Result> Handle(ForgotPasswordCommand cmd, CancellationToken ct)
    {
        // Always return success to prevent email enumeration
        var token = await authUserService.GeneratePasswordResetTokenAsync(cmd.Email, ct);
        if (!string.IsNullOrEmpty(token))
        {
            await emailService.SendAsync(
                cmd.Email,
                "Reset your password — YamiFlow",
                $"Use this token to reset your password: {token}",
                ct);
        }

        return Result.Success();
    }
}
