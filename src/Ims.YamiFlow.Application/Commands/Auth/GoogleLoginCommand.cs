using Ims.YamiFlow.Domain.Constants;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Auth;

public record GoogleLoginCommand(string IdToken, string? IpAddress, string? UserAgent);

public class GoogleLoginHandler(
    IGoogleTokenValidator googleTokenValidator,
    IAuthUserService authUserService,
    ITokenService tokenService,
    IAuthEventService authEventService)
    : IHandler<GoogleLoginCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(GoogleLoginCommand cmd, CancellationToken ct)
    {
        var googleUser = await googleTokenValidator.ValidateAsync(cmd.IdToken, ct);

        if (googleUser is null)
            return Result.Failure<LoginResponse>("Invalid Google token.");

        var user = await authUserService.FindByEmailAsync(googleUser.Email, ct);

        if (user is null)
        {
            var (succeeded, errors) = await authUserService.CreateExternalUserAsync(
                googleUser.Email, googleUser.Name, ct);

            if (!succeeded)
                return Result.Failure<LoginResponse>(string.Join("; ", errors));

            user = await authUserService.FindByEmailAsync(googleUser.Email, ct);
            await authUserService.AddToRoleAsync(user!.Id, "Student", ct);
        }

        if (!user!.IsActive)
        {
            await authEventService.LogAsync(AuthEvent.Create(
                AuthEventTypes.LoginFailed,
                userId: user.Id,
                email: user.Email,
                success: false,
                failureReason: "Account deactivated",
                ipAddress: cmd.IpAddress,
                userAgent: cmd.UserAgent), ct);

            return Result.Failure<LoginResponse>("Account is deactivated.");
        }

        var tokens = await tokenService.GenerateTokensAsync(user.Id);
        var roles = await authUserService.GetRolesAsync(user.Id, ct);
        var role = roles.FirstOrDefault() ?? "Student";

        await authEventService.LogAsync(AuthEvent.Create(
            AuthEventTypes.LoginSuccess,
            userId: user.Id,
            email: user.Email,
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
