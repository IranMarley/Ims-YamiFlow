using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces.Repositories;

public interface ICertificateRepository
{
    Task<Certificate?> GetByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default);
    Task<Certificate?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task AddAsync(Certificate certificate, CancellationToken ct = default);
}
