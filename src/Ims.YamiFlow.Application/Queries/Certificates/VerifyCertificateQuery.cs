using Dapper;

namespace Ims.YamiFlow.Application.Queries.Certificates;

// ── Query ─────────────────────────────────────────────
public record VerifyCertificateQuery(string Code);

// ── Response ──────────────────────────────────────────
public record CertificateVerification(
    string Code,
    string CourseTitle,
    string StudentName,
    DateTime IssuedAt,
    bool IsValid
);

// ── Handler ───────────────────────────────────────────
public class VerifyCertificateHandler(IDbConnectionFactory db)
    : IHandler<VerifyCertificateQuery, Result<CertificateVerification>>
{
    public async Task<Result<CertificateVerification>> Handle(VerifyCertificateQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT cert."Code"       AS Code,
                   c."Title"         AS CourseTitle,
                   u."FullName"      AS StudentName,
                   cert."IssuedAt"   AS IssuedAt
            FROM "Certificates" cert
            INNER JOIN "Courses"      c ON c."Id" = cert."CourseId"
            INNER JOIN "AspNetUsers"  u ON u."Id" = cert."StudentId"
            WHERE cert."Code" = @Code
            """;

        var row = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new { Code = q.Code.ToUpper() });
        if (row is null)
            return Result.Failure<CertificateVerification>("Certificate not found.");

        return Result.Success(new CertificateVerification(
            (string)row.Code,
            (string)row.CourseTitle,
            (string)row.StudentName,
            (DateTime)row.IssuedAt,
            IsValid: true));
    }
}
