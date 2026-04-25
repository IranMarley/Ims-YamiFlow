using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class CouponRepository(AppDbContext db) : ICouponRepository
{
    public async Task<Coupon?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Coupons.FindAsync([id], ct);

    public async Task<Coupon?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await db.Coupons.FirstOrDefaultAsync(c => c.Code == code.ToUpper(), ct);

    public async Task AddAsync(Coupon coupon, CancellationToken ct = default)
        => await db.Coupons.AddAsync(coupon, ct);

    public void Update(Coupon coupon)
        => db.Coupons.Update(coupon);

    public void Remove(Coupon coupon)
        => db.Coupons.Remove(coupon);
}
