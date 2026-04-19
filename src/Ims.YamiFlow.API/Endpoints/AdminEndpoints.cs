using Ims.YamiFlow.Application.Commands.Admin;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Admin;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints;

public static class AdminEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin").WithTags(Resources.User);

        group.MapGet("/stats", async (GetAdminStatsHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetAdminStatsQuery(), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("GetAdminStats");

        group.MapGet("/users", async (string? search, int page, int pageSize, ListUsersHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new ListUsersQuery(search, page, pageSize), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("ListUsers");

        group.MapPut("/users/{userId}", async (
            string userId,
            [FromBody] UpdateUserRequest req,
            UpdateUserByAdminHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new UpdateUserByAdminCommand(userId, req.FullName, req.Role), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("UpdateUser");

        group.MapPost("/users/{userId}/toggle-status", async (
            string userId,
            ToggleUserStatusRequest req,
            ToggleUserStatusHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new ToggleUserStatusCommand(userId, req.IsActive), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("ToggleUserStatus");
    }
}

public record UpdateUserRequest(string FullName, string Role);
public record ToggleUserStatusRequest(bool IsActive);
