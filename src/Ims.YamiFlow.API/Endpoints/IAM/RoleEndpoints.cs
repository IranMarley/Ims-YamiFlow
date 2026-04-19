using Ims.YamiFlow.Application.IAM.Commands.Roles;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.IAM.Queries;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints.IAM;

public static class RoleEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/iam/roles").WithTags(Resources.Role);

        group.MapPost("/", async (CreateRoleCommand cmd, CreateRoleHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(cmd, ct);
            return result.IsSuccess ? Results.Created() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Create))
        .WithName("CreateRole");

        group.MapGet("/", async (ListRolesHandler handler, CancellationToken ct) =>
            Results.Ok((await handler.Handle(new ListRolesQuery(), ct)).Value))
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Read))
        .WithName("ListRoles");

        group.MapPut("/{roleId}", async (
            string roleId, [FromBody] UpdateRoleRequest req, UpdateRoleHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new UpdateRoleCommand(roleId, req.Description), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Update))
        .WithName("UpdateRole");

        group.MapDelete("/{roleId}", async (string roleId, DeleteRoleHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new DeleteRoleCommand(roleId), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Delete))
        .WithName("DeleteRole");
    }
}

public record UpdateRoleRequest(string Description);
