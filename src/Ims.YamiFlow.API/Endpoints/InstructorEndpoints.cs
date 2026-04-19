using System.Security.Claims;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Instructor;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class InstructorEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/instructor").WithTags(Resources.Instructor);

        group.MapGet("/courses", async (
            int page,
            int pageSize,
            GetMyCoursesHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var instructorId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Results.Ok(await handler.Handle(new GetMyCoursesQuery(instructorId, page, pageSize), ct));
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Instructor, Operations.Read))
        .WithName("GetInstructorCourses");

        group.MapGet("/stats", async (GetMyStatsHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var instructorId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await handler.Handle(new GetMyStatsQuery(instructorId), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Instructor, Operations.Read))
        .WithName("GetInstructorStats");
    }
}
