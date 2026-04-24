using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record ResendConfirmationCommand(string Email);

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
    IOutboxService outboxService,
    IConfiguration config)
    : IHandler<ResendConfirmationCommand, Result>
{
    public async Task<Result> Handle(ResendConfirmationCommand cmd, CancellationToken ct)
    {
        // Always return success to prevent email enumeration
        var user = await authUserService.FindByEmailAsync(cmd.Email, ct);
        if (user is not null && !user.EmailConfirmed)
        {
            var token = await authUserService.GenerateEmailConfirmationTokenAsync(user.Id, ct);
            var appUrl = config["AppUrl"];
            var link = $"{appUrl}/confirm-email?email={Uri.EscapeDataString(cmd.Email)}&token={Uri.EscapeDataString(token)}";

            await outboxService.EnqueueAsync(
                OutboxMessageTypes.ConfirmEmail,
                new ConfirmEmailPayload(cmd.Email, user.FullName, link),
                ct);
        }

        return Result.Success();
    }
}
