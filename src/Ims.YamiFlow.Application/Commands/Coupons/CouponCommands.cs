using FluentValidation;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Enums;

using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Coupons;

// ── Responses ─────────────────────────────────────────
public record CouponResponse(
    Guid CouponId,
    string Code,
    decimal Discount,
    bool IsPercentage,
    DateTime? ExpiresAt,
    int? MaxUses
);

public record CouponValidationResponse(
    bool IsValid,
    decimal DiscountAmount,
    decimal FinalPrice,
    string? Message
);

// ── CreateCouponCommand ───────────────────────────────
public record CreateCouponCommand(
    string Code,
    decimal Discount,
    bool IsPercentage,
    DateTime ExpiresAt,
    int? MaxUses
);

public class CreateCouponValidator : AbstractValidator<CreateCouponCommand>
{
    public CreateCouponValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Discount).GreaterThan(0);
        RuleFor(x => x.ExpiresAt).GreaterThan(DateTime.UtcNow);
    }
}

public class CreateCouponHandler(ICouponRepository couponRepository, IUnitOfWork uow)
    : IHandler<CreateCouponCommand, Result<CouponResponse>>
{
    public async Task<Result<CouponResponse>> Handle(CreateCouponCommand cmd, CancellationToken ct)
    {
        var existing = await couponRepository.GetByCodeAsync(cmd.Code, ct);
        if (existing is not null)
            return Result.Failure<CouponResponse>("A coupon with this code already exists.");

        var type = cmd.IsPercentage ? CouponType.Percentage : CouponType.FixedAmount;
        var coupon = Coupon.Create(cmd.Code, type, cmd.Discount, cmd.MaxUses, (DateTime?)cmd.ExpiresAt);

        await couponRepository.AddAsync(coupon, ct);
        await uow.CommitAsync(ct);

        return Result.Success(new CouponResponse(
            coupon.Id,
            coupon.Code,
            coupon.Value,
            cmd.IsPercentage,
            coupon.ExpiresAt,
            coupon.MaxUses
        ));
    }
}

// ── DeleteCouponCommand ───────────────────────────────
public record DeleteCouponCommand(Guid CouponId);

public class DeleteCouponValidator : AbstractValidator<DeleteCouponCommand>
{
    public DeleteCouponValidator()
    {
        RuleFor(x => x.CouponId).NotEmpty();
    }
}

public class DeleteCouponHandler(ICouponRepository couponRepository, IUnitOfWork uow)
    : IHandler<DeleteCouponCommand, Result>
{
    public async Task<Result> Handle(DeleteCouponCommand cmd, CancellationToken ct)
    {
        var coupon = await couponRepository.GetByIdAsync(cmd.CouponId, ct);
        if (coupon is null)
            return Result.Failure("Coupon not found.");

        couponRepository.Remove(coupon);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}

// ── ValidateCouponCommand ─────────────────────────────
public record ValidateCouponCommand(string Code, decimal CoursePrice);

public class ValidateCouponValidator : AbstractValidator<ValidateCouponCommand>
{
    public ValidateCouponValidator()
    {
        RuleFor(x => x.Code).NotEmpty();
        RuleFor(x => x.CoursePrice).GreaterThanOrEqualTo(0);
    }
}

public class ValidateCouponHandler(ICouponRepository couponRepository)
    : IHandler<ValidateCouponCommand, Result<CouponValidationResponse>>
{
    public async Task<Result<CouponValidationResponse>> Handle(ValidateCouponCommand cmd, CancellationToken ct)
    {
        var coupon = await couponRepository.GetByCodeAsync(cmd.Code, ct);
        if (coupon is null)
            return Result.Success(new CouponValidationResponse(false, 0, cmd.CoursePrice, "Coupon not found."));

        if (!coupon.IsValid())
            return Result.Success(new CouponValidationResponse(false, 0, cmd.CoursePrice, "Coupon is expired or has reached its usage limit."));

        var finalPrice = coupon.Apply(cmd.CoursePrice);
        var discountAmount = cmd.CoursePrice - finalPrice;

        return Result.Success(new CouponValidationResponse(true, discountAmount, finalPrice, null));
    }
}
