using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Affiliates;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Affiliates;
using MediatR;

namespace Ims.YamiFlow.API.Endpoints;

public static class AffiliateEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/affiliates").WithTags(Resources.Affiliate);

        group.MapGet("/stats", async (IMediator mediator, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new GetAffiliateStatsQuery(userId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Affiliate, Operations.Read))
        .WithName("GetAffiliateStats");

        group.MapPost("/links", async (
            CreateAffiliateLinkRequest req,
            IMediator mediator,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await mediator.Send(new CreateAffiliateLinkCommand(userId, req.CourseId), ct);
            return result.IsSuccess
                ? Results.Created($"/api/affiliates/links/{result.Value!.LinkId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Affiliate, Operations.Create))
        .WithName("CreateAffiliateLink");
    }
}

public record CreateAffiliateLinkRequest(Guid CourseId);
