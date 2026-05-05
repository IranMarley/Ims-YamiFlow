using Ims.YamiFlow.API.Middlewares;
using Serilog;

namespace Ims.YamiFlow.API.Extensions;

public static class ProgramExtensions
{
    public static WebApplicationBuilder AddProgramServices(this WebApplicationBuilder builder)
    {
        // Register application services using existing extension methods
        builder.Services
            .AddDatabase(builder.Configuration)
            .AddIdentityConfig()
            .AddJwtAuthentication(builder.Configuration)
            .AddDynamicAuthorization()
            .AddApplicationServices()
            .AddInfrastructureServices(builder.Configuration)
            .AddMediaServices(builder.Configuration)
            .AddStripeIntegration(builder.Configuration)
            .AddCacheServices(builder.Configuration)
            .AddWebhookServices(builder.Configuration)
            .AddRateLimitingConfig()
            .AddCorsConfig(builder.Configuration)
            .AddSwaggerConfig()
            .AddHealthChecks();

        builder.Services.AddHsts(options =>
        {
            options.Preload = true;
            options.IncludeSubDomains = true;
            options.MaxAge = TimeSpan.FromDays(365);
        });

        builder.Services.AddOpenTelemetryConfig(builder.Configuration);

        return builder;
    }

    public static WebApplication UseProgramPipeline(this WebApplication app)
    {
        app.UseMiddleware<SecurityHeadersMiddleware>();

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }
        else
        {
            // Swagger
            app.UseSwagger();
            app.UseSwaggerUI(opt =>
            {
                opt.SwaggerEndpoint("/swagger/v1/swagger.json", "YamiFlow API v1");
                opt.RoutePrefix = "swagger";
            });       
        }

        app.UseMiddleware<ExceptionHandlerMiddleware>();
        
        app.UseOpenTelemetryPrometheus();
        app.UseSerilogRequestLogging();
        app.UseCors();

        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();

        // Endpoints
        app.MapAllEndpoints();
        app.MapHealthChecks("/health");

        return app;
    }
}
