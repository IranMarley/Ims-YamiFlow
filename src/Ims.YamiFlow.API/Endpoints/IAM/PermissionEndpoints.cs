using Ims.YamiFlow.Application.IAM.Commands.Permissions;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.IAM.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints.IAM;

public static class PermissionEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/iam/roles/{roleId}/permissions").WithTags(Resources.Role);

        group.MapGet("/", async (string roleId, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetRolePermissionsQuery(roleId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Read))
        .WithName("GetRolePermissions");

        group.MapPost("/", async (
            string roleId, [FromBody] PermissionBody body, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new AddPermissionCommand(roleId, body.Resource, body.Operation), ct);
            return result.IsSuccess ? Results.Created() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Update))
        .WithName("AddPermission");

        group.MapDelete("/", async (
            string roleId, [FromBody] PermissionBody body, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new RemovePermissionCommand(roleId, body.Resource, body.Operation), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Update))
        .WithName("RemovePermission");

        app.MapGet("/api/iam/resources", () =>
            Results.Ok(Resources.All.Select(r => new
            {
                Resource = r,
                Operations = Resources.SupportedOperations.TryGetValue(r, out var ops)
                             ? ops
                             : Array.Empty<string>()
            })))
        .RequireAuthorization(x => x.RequireClaim(Resources.Role, Operations.Read))
        .WithTags(Resources.Role)
        .WithName("ListAvailableResources");
    }
}

public record PermissionBody(string Resource, string Operation);
