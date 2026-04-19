using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Modules;
using Ims.YamiFlow.Application.IAM.Constants;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class ModuleEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/courses/{courseId:guid}/modules").WithTags(Resources.Module).RequireRateLimiting("default");

        group.MapPost("/", async (
            Guid courseId, [FromBody] AddModuleRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new AddModuleCommand(
                courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!, req.Title, req.Order), ct);
            return result.IsSuccess
                ? Results.Created($"/api/courses/{courseId}/modules/{result.Value!.ModuleId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Module, Operations.Create))
        .WithName("AddModule");

        group.MapPut("/{moduleId:guid}", async (
            Guid courseId, Guid moduleId, [FromBody] UpdateModuleRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new UpdateModuleCommand(
                courseId, moduleId, user.FindFirstValue(ClaimTypes.NameIdentifier)!, req.Title), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Module, Operations.Update))
        .WithName("UpdateModule");

        group.MapDelete("/{moduleId:guid}", async (
            Guid courseId, Guid moduleId,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await mediator.Send(new DeleteModuleCommand(
                courseId, moduleId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Module, Operations.Delete))
        .WithName("DeleteModule");

        group.MapPut("/reorder", async (
            Guid courseId, [FromBody] ReorderModulesRequest req,
            IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var items = req.Items.Select(i => new ModuleOrderItem(i.ModuleId, i.Order)).ToList();
            var result = await mediator.Send(new ReorderModulesCommand(
                courseId, user.FindFirstValue(ClaimTypes.NameIdentifier)!, items), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Module, Operations.Update))
        .WithName("ReorderModules");
    }
}

// ── Request records ───────────────────────────────────
public record AddModuleRequest(string Title, int Order);
public record UpdateModuleRequest(string Title);
public record ReorderModuleItem(Guid ModuleId, int Order);
public record ReorderModulesRequest(IReadOnlyList<ReorderModuleItem> Items);
