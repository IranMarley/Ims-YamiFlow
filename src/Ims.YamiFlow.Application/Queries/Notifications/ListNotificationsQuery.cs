using MediatR;

namespace Ims.YamiFlow.Application.Queries.Notifications;

// ── Response ──────────────────────────────────────────
public record NotificationItem(
    Guid NotificationId,
    string Title,
    string Body,
    bool IsRead,
    DateTime CreatedAt
);

// ── Query ─────────────────────────────────────────────
public record ListNotificationsQuery(
    string UserId,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedResult<NotificationItem>>, IPaginatedQuery;

// ── Handler ───────────────────────────────────────────
public class ListNotificationsHandler(IDbConnectionFactory db)
    : IRequestHandler<ListNotificationsQuery, PagedResult<NotificationItem>>
{
    public Task<PagedResult<NotificationItem>> Handle(ListNotificationsQuery q, CancellationToken ct)
    {
        // TODO: Query Notifications table via Dapper
        return Task.FromResult(new PagedResult<NotificationItem>([], 0, q.Page, q.PageSize));
    }
}
