using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Entities;

using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Certificates;

public record IssueCertificateCommand(Guid EnrollmentId, string StudentId)
   ;

public record CertificateResponse(Guid CertificateId, string Code, DateTime IssuedAt);

public class IssueCertificateHandler(
    IEnrollmentRepository enrollmentRepository,
    ICertificateRepository certificateRepository,
    ICourseRepository courseRepository,
    IUnitOfWork uow)
    : IHandler<IssueCertificateCommand, Result<CertificateResponse>>
{
    public async Task<Result<CertificateResponse>> Handle(
        IssueCertificateCommand cmd, CancellationToken ct)
    {
        var enrollment = await enrollmentRepository.GetByIdAsync(cmd.EnrollmentId, ct);
        if (enrollment is null)
            return Result.Failure<CertificateResponse>("Matrícula não encontrada.");

        if (enrollment.StudentId != cmd.StudentId)
            return Result.Failure<CertificateResponse>("Acesso negado.");

        // return existing certificate if already issued
        var existing = await certificateRepository.GetByEnrollmentIdAsync(cmd.EnrollmentId, ct);
        if (existing is not null)
            return Result.Success(new CertificateResponse(existing.Id, existing.Code, existing.IssuedAt));

        // fetch total lessons for eligibility check
        var course = await courseRepository.GetByIdWithModulesAsync(enrollment.CourseId, ct);
        if (course is null)
            return Result.Failure<CertificateResponse>("Curso não encontrado.");

        var totalLessons = course.Modules.SelectMany(m => m.Lessons).Count();

        if (!enrollment.IsEligibleForCertificate(totalLessons))
            return Result.Failure<CertificateResponse>(
                "Aluno ainda não concluiu todas as aulas do curso.");

        var certificate = Certificate.Create(cmd.EnrollmentId, cmd.StudentId, enrollment.CourseId);
        await certificateRepository.AddAsync(certificate, ct);
        await uow.CommitAsync(ct);

        return Result.Success(new CertificateResponse(certificate.Id, certificate.Code, certificate.IssuedAt));
    }
}
