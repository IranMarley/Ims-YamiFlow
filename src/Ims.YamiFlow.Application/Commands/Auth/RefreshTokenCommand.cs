using MediatR;

namespace Ims.YamiFlow.Application.Commands.Auth;

public record RefreshTokenCommand(string RefreshToken) : IRequest<Result<RefreshTokenResponse>>;

public record RefreshTokenResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt);

public class RefreshTokenHandler(ITokenService tokenService)
    : IRequestHandler<RefreshTokenCommand, Result<RefreshTokenResponse>>
{
    public async Task<Result<RefreshTokenResponse>> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var tokens = await tokenService.RefreshAsync(cmd.RefreshToken);
        if (tokens is null)
            return Result.Failure<RefreshTokenResponse>("Invalid or expired refresh token.");

        return Result.Success(new RefreshTokenResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.AccessTokenExpiry));
    }
}
