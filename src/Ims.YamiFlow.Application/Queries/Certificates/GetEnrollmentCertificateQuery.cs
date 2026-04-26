using Ims.YamiFlow.Application.Commands.Certificates;
using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Queries.Certificates;

// ── Query ─────────────────────────────────────────────
public record GetEnrollmentCertificateQuery(Guid EnrollmentId, string StudentId);

// ── Handler ───────────────────────────────────────────
public class GetEnrollmentCertificateHandler(
    ICertificateRepository certificateRepository,
    IEnrollmentRepository enrollmentRepository)
    : IHandler<GetEnrollmentCertificateQuery, Result<CertificateResponse?>>
{
    public async Task<Result<CertificateResponse?>> Handle(
        GetEnrollmentCertificateQuery query, CancellationToken ct)
    {
        var enrollment = await enrollmentRepository.GetByIdAsync(query.EnrollmentId, ct);
        if (enrollment is null || enrollment.StudentId != query.StudentId)
            return Result.Failure<CertificateResponse?>("Enrollment not found.");

        var cert = await certificateRepository.GetByEnrollmentIdAsync(query.EnrollmentId, ct);
        if (cert is null)
            return Result.Success<CertificateResponse?>(null);

        return Result.Success<CertificateResponse?>(
            new CertificateResponse(cert.Id, cert.Code, cert.IssuedAt));
    }
}
