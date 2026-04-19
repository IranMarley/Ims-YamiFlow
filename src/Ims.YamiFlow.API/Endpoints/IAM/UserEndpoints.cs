using Ims.YamiFlow.Application.IAM.Commands.Users;
using Ims.YamiFlow.Application.IAM.Constants;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints.IAM;

public static class UserEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/iam/users/{userId}/roles").WithTags(Resources.User);

        group.MapPost("/", async (
            string userId, [FromBody] RoleBody body, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new AssignRoleCommand(userId, body.RoleName), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("AssignRole");

        group.MapDelete("/{roleName}", async (
            string userId, string roleName, IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new RemoveRoleCommand(userId, roleName), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("RemoveRole");
    }
}

public record RoleBody(string RoleName);
