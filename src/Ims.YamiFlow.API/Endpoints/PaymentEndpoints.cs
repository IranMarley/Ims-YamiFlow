using System.Security.Claims;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Payments;

namespace Ims.YamiFlow.API.Endpoints;

public static class PaymentEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payments").WithTags(Resources.Payment);

        // Payment history — entries are created by the Stripe webhook handler
        // as invoices are paid or fail. There is no "initiate payment" endpoint;
        // subscription creation flows through /api/subscriptions/subscribe.
        group.MapGet("/history", async (
            int page,
            int pageSize,
            GetPaymentHistoryHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return Results.Ok(await handler.Handle(new GetPaymentHistoryQuery(userId, page, pageSize), ct));
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Payment, Operations.Read))
        .WithName("GetPaymentHistory");
    }
}
