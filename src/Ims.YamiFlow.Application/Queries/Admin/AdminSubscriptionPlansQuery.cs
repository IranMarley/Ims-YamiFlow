using Dapper;

namespace Ims.YamiFlow.Application.Queries.Admin;

public record SubscriptionPlanAdminItem(
    Guid Id,
    string Name,
    string Description,
    string StripePriceId,
    decimal Amount,
    string Currency,
    string Interval,
    bool IsActive,
    int SortOrder
);

public record GetAdminSubscriptionPlansQuery;

public class GetAdminSubscriptionPlansHandler(IDbConnectionFactory db)
    : IHandler<GetAdminSubscriptionPlansQuery, Result<IReadOnlyList<SubscriptionPlanAdminItem>>>
{
    public async Task<Result<IReadOnlyList<SubscriptionPlanAdminItem>>> Handle(
        GetAdminSubscriptionPlansQuery q, CancellationToken ct)
    {
        using var conn = db.Create();

        var sql = """
            SELECT
                sp."Id",
                sp."Name",
                sp."Description",
                sp."StripePriceId",
                sp."Amount",
                sp."Currency",
                sp."Interval",
                sp."IsActive",
                sp."SortOrder"
            FROM "SubscriptionPlans" sp
            ORDER BY sp."SortOrder", sp."Amount"
            """;

        var rows = await conn.QueryAsync<SubscriptionPlanAdminItem>(sql);
        return Result.Success<IReadOnlyList<SubscriptionPlanAdminItem>>(rows.ToList());
    }
}
