using Dapper;

namespace Ims.YamiFlow.Application.Queries.Payments;

public record PaymentItem(
    Guid PaymentId,
    Guid? SubscriptionId,
    decimal Amount,
    string Currency,
    string Status,
    string? Description,
    string? ReceiptUrl,
    DateTime CreatedAt,
    DateTime? PaidAt);

public record GetPaymentHistoryQuery(
    string UserId,
    int Page = 1,
    int PageSize = 20
) : IPaginatedQuery;

public class GetPaymentHistoryHandler(IDbConnectionFactory db)
    : IHandler<GetPaymentHistoryQuery, PagedResult<PaymentItem>>
{
    public async Task<PagedResult<PaymentItem>> Handle(
        GetPaymentHistoryQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var page = q.Page < 1 ? 1 : q.Page;
        var pageSize = q.PageSize is < 1 or > 100 ? 20 : q.PageSize;
        var offset = (page - 1) * pageSize;

        var total = await conn.ExecuteScalarAsync<int>(
            """SELECT COUNT(*) FROM "Payments" WHERE "UserId" = @UserId""",
            new { q.UserId });

        var rows = await conn.QueryAsync<PaymentItem>(
            """
            SELECT "Id" AS "PaymentId", "SubscriptionId", "Amount", "Currency",
                   "Status", "Description", "ReceiptUrl", "CreatedAt", "PaidAt"
            FROM "Payments"
            WHERE "UserId" = @UserId
            ORDER BY "CreatedAt" DESC
            OFFSET @Offset LIMIT @Limit
            """,
            new { q.UserId, Offset = offset, Limit = pageSize });

        return new PagedResult<PaymentItem>(rows.ToList(), total, page, pageSize);
    }
}
