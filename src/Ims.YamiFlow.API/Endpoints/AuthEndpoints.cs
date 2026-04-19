using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Auth;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class AuthEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags(Resources.Auth).RequireRateLimiting("auth");

        group.MapPost("/register", async (RegisterCommand cmd, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(cmd, ct);
            return result.IsSuccess
                ? Results.Created($"/api/users/{result.Value!.UserId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("Register");

        group.MapPost("/login", async (LoginRequest req, HttpContext ctx, IMediator mediator, CancellationToken ct) =>
        {
            var cmd = new LoginCommand(
                req.Email,
                req.Password,
                ctx.Connection.RemoteIpAddress?.ToString(),
                ctx.Request.Headers.UserAgent.ToString());

            var result = await mediator.Send(cmd, ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.Unauthorized();
        })
        .AllowAnonymous()
        .WithName("Login");

        group.MapPost("/refresh-token", async (RefreshTokenCommand cmd, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(cmd, ct);
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

        group.MapPost("/forgot-password", async (ForgotPasswordRequest req, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new ForgotPasswordCommand(req.Email), ct);
            return Results.Ok(new { message = "If that email exists, a reset link has been sent." });
        })
        .AllowAnonymous()
        .WithName("ForgotPassword");

        group.MapPost("/reset-password", async (ResetPasswordRequest req, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new ResetPasswordCommand(req.Email, req.Token, req.NewPassword), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("ResetPassword");

        group.MapPost("/change-password", async (
            ChangePasswordRequest req, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(
                new ChangePasswordCommand(userId, req.CurrentPassword, req.NewPassword), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("ChangePassword");

        group.MapPost("/confirm-email", async (ConfirmEmailRequest req, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new ConfirmEmailCommand(req.Email, req.Token), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .AllowAnonymous()
        .WithName("ConfirmEmail");

        group.MapPost("/resend-confirmation", async (ResendConfirmationRequest req, IMediator mediator, CancellationToken ct) =>
        {
            await mediator.Send(new ResendConfirmationCommand(req.Email), ct);
            return Results.Ok(new { message = "If that email exists and is unconfirmed, a new confirmation email has been sent." });
        })
        .AllowAnonymous()
        .WithName("ResendConfirmation");

        group.MapGet("/profile", async (ClaimsPrincipal user, IAuthUserService authUserService, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null) return Results.Unauthorized();
            var dto = await authUserService.FindByIdAsync(userId, ct);
            return dto is null ? Results.NotFound() : Results.Ok(dto);
        })
        .RequireAuthorization()
        .WithName("GetProfile");

        group.MapPut("/profile", async (UpdateProfileRequest req, IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new UpdateProfileCommand(userId, req.FullName), ct);
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
