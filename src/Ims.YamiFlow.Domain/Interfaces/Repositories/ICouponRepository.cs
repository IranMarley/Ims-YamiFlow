using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface ICouponRepository
{
    Task<Coupon?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Coupon?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task AddAsync(Coupon coupon, CancellationToken ct = default);
    void Update(Coupon coupon);
    void Remove(Coupon coupon);
}
