using FluentValidation;
using Ims.YamiFlow.Domain.Constants;
using Ims.YamiFlow.Domain.Entities;

using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Auth;

public record LoginCommand(
    string Email,
    string Password,
    string? IpAddress,
    string? UserAgent);

public record LoginResponse(
    string UserId,
    string FullName,
    string Email,
    string Role,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt);

public class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginHandler(
    IAuthUserService authUserService,
    ITokenService tokenService,
    IAuthEventService authEventService)
    : IHandler<LoginCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await authUserService.FindByEmailAsync(cmd.Email, ct);

        if (user is null)
        {
            await authEventService.LogAsync(AuthEvent.Create(
                AuthEventTypes.UserNotFound,
                userId: null,
                email: cmd.Email,
                success: false,
                failureReason: "User not found",
                ipAddress: cmd.IpAddress,
                userAgent: cmd.UserAgent), ct);

            return Result.Failure<LoginResponse>("Invalid credentials.");
        }

        var passwordValid = await authUserService.CheckPasswordAsync(cmd.Email, cmd.Password, ct);

        if (!passwordValid)
        {
            await authEventService.LogAsync(AuthEvent.Create(
                AuthEventTypes.LoginFailed,
                userId: user.Id,
                email: cmd.Email,
                success: false,
                failureReason: "Invalid password",
                ipAddress: cmd.IpAddress,
                userAgent: cmd.UserAgent), ct);

            return Result.Failure<LoginResponse>("Invalid credentials.");
        }

        if (!user.IsActive)
        {
            await authEventService.LogAsync(AuthEvent.Create(
                AuthEventTypes.LoginFailed,
                userId: user.Id,
                email: cmd.Email,
                success: false,
                failureReason: "Account deactivated",
                ipAddress: cmd.IpAddress,
                userAgent: cmd.UserAgent), ct);

            return Result.Failure<LoginResponse>("Account is deactivated.");
        }

        if (!user.EmailConfirmed)
        {
            await authEventService.LogAsync(AuthEvent.Create(
                AuthEventTypes.LoginFailed,
                userId: user.Id,
                email: cmd.Email,
                success: false,
                failureReason: "Email not confirmed",
                ipAddress: cmd.IpAddress,
                userAgent: cmd.UserAgent), ct);

            return Result.Failure<LoginResponse>("Please confirm your email address before logging in.");
        }

        var tokens = await tokenService.GenerateTokensAsync(user.Id);
        var roles = await authUserService.GetRolesAsync(user.Id, ct);
        var role = roles.FirstOrDefault() ?? "Student";

        await authEventService.LogAsync(AuthEvent.Create(
            AuthEventTypes.LoginSuccess,
            userId: user.Id,
            email: cmd.Email,
            success: true,
            failureReason: null,
            ipAddress: cmd.IpAddress,
            userAgent: cmd.UserAgent), ct);

        return Result.Success(new LoginResponse(
            UserId: user.Id,
            FullName: user.FullName,
            Email: user.Email,
            Role: role,
            AccessToken: tokens.AccessToken,
            RefreshToken: tokens.RefreshToken,
            ExpiresAt: tokens.AccessTokenExpiry));
    }
}
