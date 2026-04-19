using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Certificates;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Certificates;
using Microsoft.AspNetCore.RateLimiting;

namespace Ims.YamiFlow.API.Endpoints;

public static class CertificateEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var issue = app
            .MapGroup("/api/enrollments/{enrollmentId:guid}/certificate")
            .WithTags(Resources.Certificate);

        issue.MapPost("/", async (
            Guid enrollmentId, IssueCertificateHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new IssueCertificateCommand(
                enrollmentId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Certificate, Operations.Read))
        .WithName("IssueCertificate");

        var verify = app
            .MapGroup("/api/certificates")
            .WithTags(Resources.Certificate);

        verify.MapGet("/{code}/verify", async (string code, VerifyCertificateHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new VerifyCertificateQuery(code), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
        })
        .AllowAnonymous()
        .WithName("VerifyCertificate");
    }
}
