using FluentValidation;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Admin;

public record CreateUserByAdminCommand(
    string Email,
    string FullName,
    string Password,
    string Role
);

public class CreateUserByAdminValidator : AbstractValidator<CreateUserByAdminCommand>
{
    private static readonly string[] AllowedRoles = ["Admin", "Instructor", "Student"];

    public CreateUserByAdminValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => AllowedRoles.Contains(r))
            .WithMessage("Role must be Admin, Instructor, or Student.");
    }
}

public record CreateUserByAdminResponse(string UserId);

public class CreateUserByAdminHandler(
    IAuthUserService authUserService)
    : IHandler<CreateUserByAdminCommand, Result<CreateUserByAdminResponse>>
{
    public async Task<Result<CreateUserByAdminResponse>> Handle(CreateUserByAdminCommand cmd, CancellationToken ct)
    {
        var (succeeded, errors) = await authUserService.CreateAsync(cmd.Email, cmd.FullName, cmd.Password, ct);
        if (!succeeded)
            return Result.Failure<CreateUserByAdminResponse>(string.Join(", ", errors));

        var user = await authUserService.FindByEmailAsync(cmd.Email, ct);
        if (user is null)
            return Result.Failure<CreateUserByAdminResponse>("User created but could not be retrieved.");

        // Force email confirmation — admin-created users don't need to verify
        await authUserService.ForceConfirmEmailAsync(user.Id, ct);

        await authUserService.AddToRoleAsync(user.Id, cmd.Role, ct);

        return Result.Success(new CreateUserByAdminResponse(user.Id));
    }
}
