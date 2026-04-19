using FluentValidation;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Notifications;

// ── MarkNotificationReadCommand ───────────────────────
public record MarkNotificationReadCommand(Guid NotificationId, string UserId) : IRequest<Result>;

public class MarkNotificationReadValidator : AbstractValidator<MarkNotificationReadCommand>
{
    public MarkNotificationReadValidator()
    {
        RuleFor(x => x.NotificationId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class MarkNotificationReadHandler : IRequestHandler<MarkNotificationReadCommand, Result>
{
    public Task<Result> Handle(MarkNotificationReadCommand cmd, CancellationToken ct)
    {
        // TODO: Find notification, verify ownership, mark as read
        return Task.FromResult(Result.Success());
    }
}

// ── MarkAllNotificationsReadCommand ───────────────────
public record MarkAllNotificationsReadCommand(string UserId) : IRequest<Result>;

public class MarkAllNotificationsReadValidator : AbstractValidator<MarkAllNotificationsReadCommand>
{
    public MarkAllNotificationsReadValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class MarkAllNotificationsReadHandler : IRequestHandler<MarkAllNotificationsReadCommand, Result>
{
    public Task<Result> Handle(MarkAllNotificationsReadCommand cmd, CancellationToken ct)
    {
        // TODO: Mark all user notifications as read
        return Task.FromResult(Result.Success());
    }
}
