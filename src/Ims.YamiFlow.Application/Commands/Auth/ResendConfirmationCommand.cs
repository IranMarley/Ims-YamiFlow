using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record ResendConfirmationCommand(string Email) : IRequest<Result>;

// ── Validator ─────────────────────────────────────────
public class ResendConfirmationValidator : AbstractValidator<ResendConfirmationCommand>
{
    public ResendConfirmationValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}

// ── Handler ───────────────────────────────────────────
public class ResendConfirmationHandler(
    IAuthUserService authUserService,
    IEmailService emailService)
    : IRequestHandler<ResendConfirmationCommand, Result>
{
    public async Task<Result> Handle(ResendConfirmationCommand cmd, CancellationToken ct)
    {
        // Always return success to prevent email enumeration
        var user = await authUserService.FindByEmailAsync(cmd.Email, ct);
        if (user is not null)
        {
            var token = await authUserService.GenerateEmailConfirmationTokenAsync(user.Id, ct);
            await emailService.SendAsync(
                cmd.Email,
                "Confirm your email — YamiFlow",
                $"Use this token to confirm your email: {token}",
                ct);
        }

        return Result.Success();
    }
}
