using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class CertificateRepository(AppDbContext db) : ICertificateRepository
{
    public async Task<Certificate?> GetByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default)
        => await db.Certificates.FirstOrDefaultAsync(c => c.EnrollmentId == enrollmentId, ct);

    public async Task<Certificate?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await db.Certificates.FirstOrDefaultAsync(c => c.Code == code, ct);

    public async Task AddAsync(Certificate certificate, CancellationToken ct = default)
        => await db.Certificates.AddAsync(certificate, ct);
}
