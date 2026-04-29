using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Admin;

// ── Command ───────────────────────────────────────────
public record RevokeUserTokensCommand(string UserId);

public class RevokeUserTokensValidator : AbstractValidator<RevokeUserTokensCommand>
{
    public RevokeUserTokensValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class RevokeUserTokensHandler(ITokenService tokenService)
    : IHandler<RevokeUserTokensCommand, Result>
{
    public async Task<Result> Handle(RevokeUserTokensCommand cmd, CancellationToken ct)
    {
        await tokenService.RevokeAsync(cmd.UserId);
        return Result.Success();
    }
}
