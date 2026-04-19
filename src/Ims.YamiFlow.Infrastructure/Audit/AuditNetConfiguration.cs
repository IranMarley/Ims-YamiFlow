using Ims.YamiFlow.Infrastructure.Auditing;
using CoreConfig = Audit.Core.Configuration;
using EfConfig = Audit.EntityFramework.Configuration;

namespace Ims.YamiFlow.Infrastructure.Audit;

public static class AuditNetConfiguration
{
    public static void Configure(IServiceProvider serviceProvider)
    {
        CoreConfig.Setup()
            .UseCustomProvider(new PostgresAuditDataProvider(serviceProvider))
            .WithCreationPolicy(global::Audit.Core.EventCreationPolicy.InsertOnEnd);

        EfConfig.Setup()
            .ForAnyContext(cfg => cfg
                .IncludeEntityObjects()
                .AuditEventType("{context}:{database}"));
    }
}
