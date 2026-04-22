using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Exporter;

namespace Ims.YamiFlow.API.Extensions;

public static class OpenTelemetryExtensions
{
    public static IServiceCollection AddOpenTelemetryConfig(this IServiceCollection services, IConfiguration configuration)
    {
        var serviceName = configuration["OTEL_SERVICE_NAME"]!;

        var resourceBuilder = ResourceBuilder.CreateDefault()
            .AddService(serviceName: serviceName,
                        serviceInstanceId: Environment.MachineName,
                        serviceVersion: "1.0.0");

        services.AddOpenTelemetry()
            .WithTracing(tracing =>
            {
                tracing
                    .SetResourceBuilder(resourceBuilder)
                    .AddAspNetCoreInstrumentation(o =>
                    {
                        o.RecordException = true;
                        o.EnrichWithHttpRequest = (activity, request) =>
                        {
                            activity.SetTag("http.route", request.Path);
                            activity.SetTag("http.method", request.Method);
                        };
                        o.EnrichWithException = (activity, exception) =>
                        {
                            activity.SetTag("exception.type", exception.GetType().Name);
                            activity.SetTag("exception.message", exception.Message);
                        };
                    })
                    .AddHttpClientInstrumentation(o => o.RecordException = true)
                    .AddEntityFrameworkCoreInstrumentation()
                    .AddRedisInstrumentation()
                    .AddSource("Ims.YamiFlow.*")
                    .AddOtlpExporter(o =>
                    {
                        o.Endpoint = new Uri(configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]!);
                        o.Protocol = OtlpExportProtocol.Grpc;
                    });
            })
            .WithMetrics(metrics =>
            {
                metrics
                    .SetResourceBuilder(resourceBuilder)

                    // ASP.NET Core
                    .AddAspNetCoreInstrumentation()

                    // HTTP client
                    .AddHttpClientInstrumentation()

                    // Runtime (.NET)
                    .AddRuntimeInstrumentation()

                    // Process (CPU, memory)
                    .AddProcessInstrumentation()

                    // Kestrel
                    .AddMeter("Microsoft.AspNetCore.Hosting")
                    .AddMeter("Microsoft.AspNetCore.Server.Kestrel")
                    .AddMeter("System.Net.Http")

                    // Prometheus scrape endpoint
                    .AddPrometheusExporter();
            });

        return services;
    }

    public static IApplicationBuilder UseOpenTelemetryPrometheus(this IApplicationBuilder app)
    {
        app.UseOpenTelemetryPrometheusScrapingEndpoint();
        return app;
    }
}