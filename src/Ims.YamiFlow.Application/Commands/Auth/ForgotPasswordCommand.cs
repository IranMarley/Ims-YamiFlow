using FluentValidation;
using Ims.YamiFlow.Application.Common;

using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record ForgotPasswordCommand(string Email);

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
    IOutboxService outboxService,
    IConfiguration config)
    : IHandler<ForgotPasswordCommand, Result>
{
    public async Task<Result> Handle(ForgotPasswordCommand cmd, CancellationToken ct)
    {
        // Always return success to prevent email enumeration
        var token = await authUserService.GeneratePasswordResetTokenAsync(cmd.Email, ct);
        if (!string.IsNullOrEmpty(token))
        {
            var appUrl = config["AppUrl"];
            var link = $"{appUrl}/reset-password?email={Uri.EscapeDataString(cmd.Email)}&token={Uri.EscapeDataString(token)}";

            await outboxService.EnqueueAsync(
                OutboxMessageTypes.ResetPassword,
                new ResetPasswordPayload(cmd.Email, link),
                ct);
        }

        return Result.Success();
    }
}
