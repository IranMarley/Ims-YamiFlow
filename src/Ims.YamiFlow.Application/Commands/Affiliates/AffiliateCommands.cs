using FluentValidation;

namespace Ims.YamiFlow.Application.Commands.Affiliates;

// ── Response ──────────────────────────────────────────
public record AffiliateLinkResponse(
    Guid LinkId,
    string UserId,
    Guid CourseId,
    string Code,
    string Url,
    DateTime CreatedAt
);

// ── Command ───────────────────────────────────────────
public record CreateAffiliateLinkCommand(string UserId, Guid CourseId);

public class CreateAffiliateLinkValidator : AbstractValidator<CreateAffiliateLinkCommand>
{
    public CreateAffiliateLinkValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CourseId).NotEmpty();
    }
}

public class CreateAffiliateLinkHandler : IHandler<CreateAffiliateLinkCommand, Result<AffiliateLinkResponse>>
{
    public Task<Result<AffiliateLinkResponse>> Handle(CreateAffiliateLinkCommand cmd, CancellationToken ct)
    {
        // TODO: Generate unique affiliate code and persist link
        var code = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var response = new AffiliateLinkResponse(
            Guid.NewGuid(),
            cmd.UserId,
            cmd.CourseId,
            code,
            Url: $"/courses/{cmd.CourseId}?ref={code}",
            DateTime.UtcNow
        );
        return Task.FromResult(Result.Success(response));
    }
}
