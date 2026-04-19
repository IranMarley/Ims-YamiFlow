using Ims.YamiFlow.Application.IAM.Commands.Roles;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.IAM.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints.IAM;

public static class RoleEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/iam/roles").WithTags(Resources.Role);

        group.MapPost("/", async (CreateRoleCommand cmd, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(cmd, ct);
            return result.IsSuccess ? Results.Created() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Create))
        .WithName("CreateRole");

        group.MapGet("/", async (IMediator mediator, CancellationToken ct) =>
            Results.Ok((await mediator.Send(new ListRolesQuery(), ct)).Value))
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Read))
        .WithName("ListRoles");

        group.MapPut("/{roleId}", async (
            string roleId, [FromBody] UpdateRoleRequest req, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new UpdateRoleCommand(roleId, req.Description), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Update))
        .WithName("UpdateRole");

        group.MapDelete("/{roleId}", async (string roleId, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new DeleteRoleCommand(roleId), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Delete))
        .WithName("DeleteRole");
    }
}

public record UpdateRoleRequest(string Description);
