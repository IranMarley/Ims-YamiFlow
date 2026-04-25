using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Admin;

// ── Command ───────────────────────────────────────────
public record UpdateUserByAdminCommand(
    string UserId,
    string FullName,
    string Role
);

// ── Validator ─────────────────────────────────────────
public class UpdateUserByAdminValidator : AbstractValidator<UpdateUserByAdminCommand>
{
    private static readonly string[] AllowedRoles = ["Admin", "Instructor", "Student"];

    public UpdateUserByAdminValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => AllowedRoles.Contains(r))
            .WithMessage("Role must be Admin, Instructor, or Student.");
    }
}

// ── Handler ───────────────────────────────────────────
public class UpdateUserByAdminHandler(
    IAuthUserService authUserService,
    IIamService iamService)
    : IHandler<UpdateUserByAdminCommand, Result>
{
    public async Task<Result> Handle(UpdateUserByAdminCommand cmd, CancellationToken ct)
    {
        var (profileOk, profileErrors) = await authUserService.UpdateProfileAsync(cmd.UserId, cmd.FullName, ct);
        if (!profileOk)
            return Result.Failure(string.Join(", ", profileErrors));

        var (roleOk, roleErrors) = await iamService.AssignRoleAsync(cmd.UserId, cmd.Role, ct);
        if (!roleOk)
            return Result.Failure(string.Join(", ", roleErrors));

        return Result.Success();
    }
}
