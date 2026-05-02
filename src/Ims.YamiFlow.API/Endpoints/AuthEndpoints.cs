using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Auth;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.API.Endpoints;

public static class AuthEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags(Resources.Auth).RequireRateLimiting("auth");

        group.MapPost("/register", async (RegisterCommand cmd, RegisterHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(cmd, ct);
            return result.IsSuccess
                ? Results.Created($"/api/users/{result.Value!.UserId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("Register");

        group.MapPost("/login", async (LoginRequest req, HttpContext ctx, LoginHandler handler, CancellationToken ct) =>
        {
            var cmd = new LoginCommand(
                req.Email,
                req.Password,
                ctx.Connection.RemoteIpAddress?.ToString(),
                ctx.Request.Headers.UserAgent.ToString());

            var result = await handler.Handle(cmd, ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("Login");

        group.MapPost("/refresh-token", async (RefreshTokenCommand cmd, RefreshTokenHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(cmd, ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.Unauthorized();
        })
        .AllowAnonymous()
        .WithName("RefreshToken");

        group.MapPost("/logout", async (ClaimsPrincipal user, ITokenService tokenService, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is not null) await tokenService.RevokeAsync(userId);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("Logout");

        group.MapPost("/forgot-password", async (ForgotPasswordRequest req, ForgotPasswordHandler handler, CancellationToken ct) =>
        {
            await handler.Handle(new ForgotPasswordCommand(req.Email), ct);
            return Results.Ok(new { message = "If that email exists, a reset link has been sent." });
        })
        .AllowAnonymous()
        .WithName("ForgotPassword");

        group.MapPost("/reset-password", async (ResetPasswordRequest req, ResetPasswordHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new ResetPasswordCommand(req.Email, req.Token, req.NewPassword), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("ResetPassword");

        group.MapPost("/change-password", async (
            ChangePasswordRequest req, ChangePasswordHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new ChangePasswordCommand(userId, req.CurrentPassword, req.NewPassword), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("ChangePassword");

        group.MapPost("/confirm-email", async (ConfirmEmailRequest req, ConfirmEmailHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new ConfirmEmailCommand(req.Email, req.Token), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("ConfirmEmail");

        group.MapPost("/resend-confirmation", async (ResendConfirmationRequest req, ResendConfirmationHandler handler, CancellationToken ct) =>
        {
            await handler.Handle(new ResendConfirmationCommand(req.Email), ct);
            return Results.Ok(new { message = "If that email exists and is unconfirmed, a new confirmation email has been sent." });
        })
        .AllowAnonymous()
        .WithName("ResendConfirmation");

        group.MapPost("/google-login", async (GoogleLoginRequest req, HttpContext ctx, GoogleLoginHandler handler, CancellationToken ct) =>
        {
            var cmd = new GoogleLoginCommand(
                req.IdToken,
                ctx.Connection.RemoteIpAddress?.ToString(),
                ctx.Request.Headers.UserAgent.ToString());

            var result = await handler.Handle(cmd, ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("GoogleLogin");

        group.MapGet("/profile", async (ClaimsPrincipal user, IAuthUserService authUserService, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();
            var dto = await authUserService.FindByIdAsync(userId, ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        })
        .RequireAuthorization()
        .WithName("GetProfile");

        group.MapPut("/profile", async (UpdateProfileRequest req, UpdateProfileHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new UpdateProfileCommand(userId, req.FullName), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("UpdateProfile");
    }
}

// ── Request records ────────────────────────────────────
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record ConfirmEmailRequest(string Email, string Token);
public record ResendConfirmationRequest(string Email);
public record UpdateProfileRequest(string FullName);
public record GoogleLoginRequest(string IdToken);
