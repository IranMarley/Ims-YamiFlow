using Ims.YamiFlow.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints;

public static class StripeWebhookEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/webhooks/stripe", async (
            HttpRequest request,
            IStripeWebhookProcessor processor,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var logger = loggerFactory.CreateLogger("StripeWebhook");

            request.EnableBuffering();
            using var reader = new StreamReader(request.Body, leaveOpen: true);
            var payload = await reader.ReadToEndAsync(ct);
            request.Body.Position = 0;

            var signature = request.Headers["Stripe-Signature"].ToString();
            if (string.IsNullOrEmpty(signature))
                return Results.BadRequest(new { error = "Missing Stripe-Signature header" });

            try
            {
                var outcome = await processor.ProcessAsync(payload, signature, ct);
                logger.LogInformation("Stripe webhook processed: {Outcome}", outcome);
                return Results.Ok(new { received = true });
            }
            catch (Stripe.StripeException ex)
            {
                logger.LogWarning(ex, "Invalid Stripe webhook signature.");
                return Results.BadRequest(new { error = "Invalid signature" });
            }
            catch (Exception ex)
            {
                // 500 causes Stripe to retry — correct behavior for transient failures.
                logger.LogError(ex, "Stripe webhook processing failed.");
                return Results.StatusCode(500);
            }
        })
        .AllowAnonymous()
        .DisableRateLimiting()
        .WithName("StripeWebhook")
        .WithTags("Webhooks");
    }
}
