using FluentValidation;
using Ims.YamiFlow.Application.Common;

using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record RegisterCommand(
    string FullName,
    string Email,
    string Password
);

// ── Response ──────────────────────────────────────────
public record RegisterResponse(string UserId, string Email, string FullName);

// ── Validator ─────────────────────────────────────────
public class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.")
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.");
    }
}

// ── Handler ───────────────────────────────────────────
public class RegisterHandler(
    IAuthUserService authUserService,
    IOutboxService outboxService,
    IConfiguration config)
    : IHandler<RegisterCommand, Result<RegisterResponse>>
{
    public async Task<Result<RegisterResponse>> Handle(RegisterCommand cmd, CancellationToken ct)
    {
        var existing = await authUserService.FindByEmailAsync(cmd.Email, ct);
        if (existing is not null)
            return Result.Failure<RegisterResponse>("Email already registered.");

        var (succeeded, errors) = await authUserService.CreateAsync(cmd.Email, cmd.FullName, cmd.Password, ct);
        if (!succeeded)
            return Result.Failure<RegisterResponse>(string.Join(", ", errors));

        var created = await authUserService.FindByEmailAsync(cmd.Email, ct);
        await authUserService.AddToRoleAsync(created!.Id, "Student", ct);

        var token = await authUserService.GenerateEmailConfirmationTokenAsync(created.Id, ct);
        var appUrl = config["AppUrl"];
        var link = $"{appUrl}/confirm-email?email={Uri.EscapeDataString(cmd.Email)}&token={Uri.EscapeDataString(token)}";

        await outboxService.EnqueueAsync(
            OutboxMessageTypes.ConfirmEmail,
            new ConfirmEmailPayload(cmd.Email, cmd.FullName, link),
            ct);

        return Result.Success(new RegisterResponse(created.Id, created.Email, cmd.FullName));
    }
}
