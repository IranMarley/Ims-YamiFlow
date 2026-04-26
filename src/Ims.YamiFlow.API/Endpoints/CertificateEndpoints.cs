using System.Security.Claims;
using Ims.YamiFlow.Application.Commands.Certificates;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Certificates;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints;

public static class CertificateEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var issue = app
            .MapGroup("/api/enrollments/{enrollmentId:guid}/certificate")
            .WithTags(Resources.Certificate);

        issue.MapGet("/", async (
            Guid enrollmentId, GetEnrollmentCertificateHandler handler, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetEnrollmentCertificateQuery(
                enrollmentId, user.FindFirstValue(ClaimTypes.NameIdentifier)!), ct);
            if (!result.IsSuccess) return Results.BadRequest(result.Error);
            return result.Value is null ? Results.NoContent() : Results.Ok(result.Value);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Certificate, Operations.Read))
        .WithName("GetEnrollmentCertificate");

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
