using Dapper;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces;

namespace Ims.YamiFlow.Infrastructure.Services;

public sealed class AuthEventService(IDbConnectionFactory connectionFactory) : IAuthEventService
{
    public async Task LogAsync(AuthEvent authEvent, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO audit."AuthEvents"
                ("EventType", "UserId", "Email", "Success", "FailureReason", "IpAddress", "UserAgent", "Location", "CreatedAt")
            VALUES
                (@EventType, @UserId, @Email, @Success, @FailureReason, @IpAddress, @UserAgent, @Location, NOW())
            """;

        using var connection = connectionFactory.Create();
        await connection.ExecuteAsync(sql, new
        {
            authEvent.EventType,
            authEvent.UserId,
            authEvent.Email,
            authEvent.Success,
            authEvent.FailureReason,
            authEvent.IpAddress,
            authEvent.UserAgent,
            authEvent.Location
        });
    }
}
