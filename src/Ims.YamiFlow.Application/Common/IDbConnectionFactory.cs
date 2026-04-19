using System.Data;

namespace Ims.YamiFlow.Application.Common;

public interface IDbConnectionFactory
{
    IDbConnection Create();
}
