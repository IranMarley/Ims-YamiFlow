using System.Text.Json;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Infrastructure.Services.Outbox;

public sealed class OutboxWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxWorker> logger) : BackgroundService
{
    private const int BatchSize = 10;
    private static readonly TimeSpan PollingInterval = TimeSpan.FromSeconds(10);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("OutboxWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "OutboxWorker encountered an unhandled error.");
            }

            await Task.Delay(PollingInterval, stoppingToken).ConfigureAwait(false);
        }

        logger.LogInformation("OutboxWorker stopped.");
    }

    private async Task ProcessBatchAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        // Outbox processing is a system operation — tag source so audit rows are identifiable.
        db.ExtraFields["Source"] = "OutboxWorker";

        // Atomically claim a batch using SELECT FOR UPDATE SKIP LOCKED so concurrent
        // workers never process the same message.
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var messages = await db.OutboxMessages
            .FromSqlRaw(
                """
                SELECT * FROM "OutboxMessages"
                WHERE "Status" = 'Pending'
                ORDER BY "CreatedAt"
                LIMIT {0}
                FOR UPDATE SKIP LOCKED
                """, BatchSize)
            .ToListAsync(ct);

        if (messages.Count == 0)
        {
            await tx.RollbackAsync(ct);
            return;
        }

        foreach (var msg in messages)
            msg.MarkProcessing();

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        // Process outside the claim transaction so one failure doesn't block others.
        foreach (var msg in messages)
            await ProcessMessageAsync(db, emailService, msg, ct);
    }

    private async Task ProcessMessageAsync(
        AppDbContext db,
        IEmailService emailService,
        OutboxMessage msg,
        CancellationToken ct)
    {
        try
        {
            await DispatchAsync(emailService, msg, ct);
            msg.MarkProcessed();
            logger.LogInformation("OutboxMessage {Id} ({Type}) processed.", msg.Id, msg.Type);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "OutboxMessage {Id} ({Type}) failed.", msg.Id, msg.Type);
            msg.MarkFailed();
        }

        await db.SaveChangesAsync(ct);
    }

    private static Task DispatchAsync(IEmailService emailService, OutboxMessage msg, CancellationToken ct)
        => msg.Type switch
        {
            OutboxMessageTypes.ConfirmEmail => SendConfirmEmailAsync(emailService, msg, ct),
            OutboxMessageTypes.ResetPassword => SendResetPasswordAsync(emailService, msg, ct),
            _ => throw new InvalidOperationException($"Unknown outbox message type: {msg.Type}")
        };

    private static async Task SendConfirmEmailAsync(IEmailService emailService, OutboxMessage msg, CancellationToken ct)
    {
        var payload = JsonSerializer.Deserialize<ConfirmEmailPayload>(msg.Payload)
            ?? throw new InvalidOperationException("Invalid ConfirmEmailPayload.");

        await emailService.SendAsync(
            payload.To,
            "Confirm your email — YamiFlow",
            EmailTemplates.ConfirmEmail(payload.Name, payload.ConfirmationLink),
            ct);
    }

    private static async Task SendResetPasswordAsync(IEmailService emailService, OutboxMessage msg, CancellationToken ct)
    {
        var payload = JsonSerializer.Deserialize<ResetPasswordPayload>(msg.Payload)
            ?? throw new InvalidOperationException("Invalid ResetPasswordPayload.");

        await emailService.SendAsync(
            payload.To,
            "Reset your password — YamiFlow",
            EmailTemplates.ResetPassword(payload.ResetLink),
            ct);
    }
}
