using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface IPaymentRepository
{
    Task<Payment?> GetByStripeInvoiceIdAsync(string stripeInvoiceId, CancellationToken ct = default);
    Task AddAsync(Payment payment, CancellationToken ct = default);
    void Update(Payment payment);
}
