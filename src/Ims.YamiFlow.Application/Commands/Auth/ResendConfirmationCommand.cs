using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Configuration;

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
    IEmailService emailService,
    IConfiguration config)
    : IRequestHandler<ResendConfirmationCommand, Result>
{
    public async Task<Result> Handle(ResendConfirmationCommand cmd, CancellationToken ct)
    {
        // Always return success to prevent email enumeration
        var user = await authUserService.FindByEmailAsync(cmd.Email, ct);
        if (user is not null && !user.EmailConfirmed)
        {
            var token = await authUserService.GenerateEmailConfirmationTokenAsync(user.Id, ct);
            var appUrl = config["Email:AppUrl"];
            var link = $"{appUrl}/confirm-email?email={Uri.EscapeDataString(cmd.Email)}&token={Uri.EscapeDataString(token)}";

            await emailService.SendAsync(
                cmd.Email,
                "Confirm your email — YamiFlow",
                EmailTemplates.ConfirmEmail(user.FullName, link),
                ct);
        }

        return Result.Success();
    }
}
