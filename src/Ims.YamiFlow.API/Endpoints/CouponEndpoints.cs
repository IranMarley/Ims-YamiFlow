using Ims.YamiFlow.Application.Commands.Coupons;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Coupons;

namespace Ims.YamiFlow.API.Endpoints;

public static class CouponEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/coupons").WithTags(Resources.Coupon);

        group.MapGet("/", async (int page, int pageSize, ListCouponsHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new ListCouponsQuery(page, pageSize), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.Coupon, Operations.Read))
        .WithName("ListCoupons");

        group.MapPost("/", async (CreateCouponRequest req, CreateCouponHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(
                new CreateCouponCommand(req.Code, req.Discount, req.IsPercentage, req.ExpiresAt, req.MaxUses), ct);
            return result.IsSuccess
                ? Results.Created($"/api/coupons/{result.Value!.CouponId}", result.Value)
                : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Coupon, Operations.Create))
        .WithName("CreateCoupon");

        group.MapDelete("/{couponId:guid}", async (Guid couponId, DeleteCouponHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new DeleteCouponCommand(couponId), ct);
            return result.IsSuccess ? Results.NoContent() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Coupon, Operations.Delete))
        .WithName("DeleteCoupon");

        group.MapPost("/validate", async (ValidateCouponRequest req, ValidateCouponHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new ValidateCouponCommand(req.Code, req.CoursePrice), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization()
        .WithName("ValidateCoupon");
    }
}

public record CreateCouponRequest(string Code, decimal Discount, bool IsPercentage, DateTime ExpiresAt, int? MaxUses);
public record ValidateCouponRequest(string Code, decimal CoursePrice);
