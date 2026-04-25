using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class PaymentRepository(AppDbContext db) : IPaymentRepository
{
    public Task<Payment?> GetByStripeInvoiceIdAsync(string stripeInvoiceId, CancellationToken ct = default)
        => db.Payments.FirstOrDefaultAsync(p => p.StripeInvoiceId == stripeInvoiceId, ct);

    public async Task AddAsync(Payment payment, CancellationToken ct = default)
        => await db.Payments.AddAsync(payment, ct);

    public void Update(Payment payment) => db.Payments.Update(payment);
}
