using FluentValidation;

namespace Ims.YamiFlow.Application.Commands.Notifications;

// ── MarkNotificationReadCommand ───────────────────────
public record MarkNotificationReadCommand(Guid NotificationId, string UserId);

public class MarkNotificationReadValidator : AbstractValidator<MarkNotificationReadCommand>
{
    public MarkNotificationReadValidator()
    {
        RuleFor(x => x.NotificationId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class MarkNotificationReadHandler : IHandler<MarkNotificationReadCommand, Result>
{
    public Task<Result> Handle(MarkNotificationReadCommand cmd, CancellationToken ct)
    {
        // TODO: Find notification, verify ownership, mark as read
        return Task.FromResult(Result.Success());
    }
}

// ── MarkAllNotificationsReadCommand ───────────────────
public record MarkAllNotificationsReadCommand(string UserId);

public class MarkAllNotificationsReadValidator : AbstractValidator<MarkAllNotificationsReadCommand>
{
    public MarkAllNotificationsReadValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public class MarkAllNotificationsReadHandler : IHandler<MarkAllNotificationsReadCommand, Result>
{
    public Task<Result> Handle(MarkAllNotificationsReadCommand cmd, CancellationToken ct)
    {
        // TODO: Mark all user notifications as read
        return Task.FromResult(Result.Success());
    }
}
