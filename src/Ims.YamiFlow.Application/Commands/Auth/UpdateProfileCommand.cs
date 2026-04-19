using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Auth;

// ── Command ───────────────────────────────────────────
public record UpdateProfileCommand(string UserId, string FullName) : IRequest<Result<UpdateProfileResponse>>;

// ── Response ──────────────────────────────────────────
public record UpdateProfileResponse(string UserId, string FullName, string Email);

// ── Validator ─────────────────────────────────────────
public class UpdateProfileValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name cannot exceed 100 characters.");
    }
}

// ── Handler ───────────────────────────────────────────
public class UpdateProfileHandler(IAuthUserService authUserService)
    : IRequestHandler<UpdateProfileCommand, Result<UpdateProfileResponse>>
{
    public async Task<Result<UpdateProfileResponse>> Handle(UpdateProfileCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await authUserService.UpdateProfileAsync(cmd.UserId, cmd.FullName, ct);
        if (!succeeded)
            return Result.Failure<UpdateProfileResponse>(string.Join(", ", errors));

        var user = await authUserService.FindByIdAsync(cmd.UserId, ct);
        return user is null
            ? Result.Failure<UpdateProfileResponse>("User not found.")
            : Result.Success(new UpdateProfileResponse(user.Id, user.FullName, user.Email));
    }
}
