using Ims.YamiFlow.Application.Commands.Admin;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Admin;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints;

public static class AdminEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin").WithTags(Resources.User);

        group.MapGet("/stats", async (IMediator mediator, CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetAdminStatsQuery(), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("GetAdminStats");

        group.MapGet("/users", async (string? search, int page, int pageSize, IMediator mediator, CancellationToken ct) =>
            Results.Ok(await mediator.Send(new ListUsersQuery(search, page, pageSize), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("ListUsers");

        group.MapPut("/users/{userId}", async (
            string userId,
            [FromBody] UpdateUserRequest req,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new UpdateUserByAdminCommand(userId, req.FullName, req.Role), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("UpdateUser");

        group.MapPost("/users/{userId}/toggle-status", async (
            string userId,
            ToggleUserStatusRequest req,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new ToggleUserStatusCommand(userId, req.IsActive), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("ToggleUserStatus");
    }
}

public record UpdateUserRequest(string FullName, string Role);
public record ToggleUserStatusRequest(bool IsActive);
