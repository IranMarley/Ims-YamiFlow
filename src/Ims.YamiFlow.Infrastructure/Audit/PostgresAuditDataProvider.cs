using System.Security.Claims;
using System.Text.Json;
using Audit.Core;
using Audit.EntityFramework;
using Dapper;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Ims.YamiFlow.Infrastructure.Audit;

public sealed class PostgresAuditDataProvider : AuditDataProvider
{
    private readonly IServiceProvider _serviceProvider;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false
    };

    public PostgresAuditDataProvider(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public override object InsertEvent(AuditEvent auditEvent)
        => InsertEventAsync(auditEvent).GetAwaiter().GetResult();

    public override async Task<object> InsertEventAsync(
        AuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var factory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
        var httpContextAccessor = scope.ServiceProvider.GetService<IHttpContextAccessor>();
        var tableNameMap = BuildTableNameMap(scope.ServiceProvider);

        var httpContext = httpContextAccessor?.HttpContext;
        var userId = httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? auditEvent.CustomFields.GetValueOrDefault("UserId")?.ToString();
        var userName = httpContext?.User.FindFirstValue(ClaimTypes.Email)
                       ?? auditEvent.CustomFields.GetValueOrDefault("UserName")?.ToString();
        var ipAddress = httpContext?.Connection.RemoteIpAddress?.ToString()
                        ?? auditEvent.CustomFields.GetValueOrDefault("IpAddress")?.ToString();

        var efEvent = auditEvent.GetEntityFrameworkEvent();

        var transactionId = efEvent?.TransactionId is not null && Guid.TryParse(efEvent.TransactionId, out var txId)
            ? txId
            : Guid.NewGuid();

        var entries = efEvent?.Entries ?? [];

        const string sql = """
            INSERT INTO audit."AuditLogs"
                ("Source", "EntityName", "Action", "UserId", "UserName", "IpAddress", "TransactionId", "Data", "CreatedAt")
            VALUES
                (@Source, @EntityName, @Action, @UserId, @UserName, @IpAddress, @TransactionId, @Data::jsonb, NOW())
            RETURNING "Id"
            """;

        using var connection = factory.Create();

        long firstId = 0;

        foreach (var entry in entries)
        {
            var data = JsonSerializer.Serialize(entry, JsonOptions);
            var entityName = tableNameMap.GetValueOrDefault(entry.Name, entry.Name);

            var id = await connection.ExecuteScalarAsync<long>(sql, new
            {
                Source = "API",
                EntityName = entityName,
                Action = entry.Action,
                UserId = userId,
                UserName = userName,
                IpAddress = ipAddress,
                TransactionId = transactionId,
                Data = data
            });

            if (firstId == 0) firstId = id;
        }

        return firstId;
    }

    public override void ReplaceEvent(object eventId, AuditEvent auditEvent)
        => ReplaceEventAsync(eventId, auditEvent).GetAwaiter().GetResult();

    public override async Task ReplaceEventAsync(
        object eventId, AuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        var efEvent = auditEvent.GetEntityFrameworkEvent();
        var entries = efEvent?.Entries ?? [];

        const string sql = """
            UPDATE audit."AuditLogs"
            SET "Data" = @Data::jsonb
            WHERE "TransactionId" = @TransactionId AND "EntityName" = @EntityName
            """;

        using var scope = _serviceProvider.CreateScope();
        var factory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
        var tableNameMap = BuildTableNameMap(scope.ServiceProvider);
        using var connection = factory.Create();

        foreach (var entry in entries)
        {
            var data = JsonSerializer.Serialize(entry, JsonOptions);
            var entityName = tableNameMap.GetValueOrDefault(entry.Name, entry.Name);
            await connection.ExecuteAsync(sql, new
            {
                Data = data,
                TransactionId = eventId,
                EntityName = entityName
            });
        }
    }

    private static Dictionary<string, string> BuildTableNameMap(IServiceProvider serviceProvider)
    {
        var db = serviceProvider.GetRequiredService<AppDbContext>();
        return db.Model.GetEntityTypes()
            .Where(t => t.GetTableName() is not null)
            .ToDictionary(
                t => t.DisplayName(),
                t => t.GetTableName()!,
                StringComparer.OrdinalIgnoreCase);
    }
}
