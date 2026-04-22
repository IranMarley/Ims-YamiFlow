using Serilog;
using Serilog.Exceptions;
using Serilog.Sinks.Grafana.Loki;
using Serilog.Enrichers.Span;

namespace Ims.YamiFlow.API.Extensions;

public static class LoggingExtensions
{
    public static WebApplicationBuilder ConfigureSerilog(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, loggerConfiguration) =>
        {
            var lokiUrl = context.Configuration["LOKI_URL"];
            var appLabel = "yamiflow-api"; // Hardcoded for consistency in dashboards
            
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .Enrich.FromLogContext()
                .Enrich.WithExceptionDetails()
                .Enrich.WithProperty("Application", appLabel)
                .Enrich.WithSpan();

            if (!string.IsNullOrWhiteSpace(lokiUrl))
            {
                loggerConfiguration.WriteTo.GrafanaLoki(lokiUrl, new[] 
                {
                    new LokiLabel { Key = "app", Value = appLabel } 
                }, new[]
                {
                    "trace_id", "span_id", "level", "exception_type"
                });
            }
        });

        return builder;
    }
}
