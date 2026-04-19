namespace Ims.YamiFlow.Domain.Entities;

public class Coupon
{
    public Guid Id { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public CouponType Type { get; private set; }
    public decimal Value { get; private set; }
    public int? MaxUses { get; private set; }
    public int CurrentUses { get; private set; }
    public DateTime? ExpiresAt { get; private set; }

    private Coupon() { }

    public static Coupon Create(string code, CouponType type, decimal value,
        int? maxUses = null, DateTime? expiresAt = null)
        => new()
        {
            Id = Guid.NewGuid(),
            Code = code.ToUpper().Trim(),
            Type = type,
            Value = value,
            MaxUses = maxUses,
            ExpiresAt = expiresAt
        };

    public bool IsValid()
    {
        if (ExpiresAt.HasValue && DateTime.UtcNow > ExpiresAt)
            return false;

        if (MaxUses.HasValue && CurrentUses >= MaxUses)
            return false;

        return true;
    }

    public decimal Apply(decimal originalPrice)
        => Type == CouponType.Percentage
            ? Math.Round(originalPrice - (originalPrice * Value / 100), 2)
            : Math.Max(0, originalPrice - Value);

    public void RegisterUse() => CurrentUses++;
}
