using System.Data;
using Ims.YamiFlow.Application.Common;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Ims.YamiFlow.Infrastructure.Persistence;

public class NpgsqlConnectionFactory(IConfiguration config) : IDbConnectionFactory
{
    public IDbConnection Create()
        => new NpgsqlConnection(config.GetConnectionString("DefaultConnection"));
}
