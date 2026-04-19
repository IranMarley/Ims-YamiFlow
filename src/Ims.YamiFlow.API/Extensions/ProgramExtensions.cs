using Ims.YamiFlow.API.Middlewares;
using Ims.YamiFlow.Infrastructure.Audit;
using Serilog;

namespace Ims.YamiFlow.API.Extensions;

public static class ProgramExtensions
{
    public static WebApplicationBuilder AddProgramServices(this WebApplicationBuilder builder)
    {
        // Serilog configuration from appsettings
        builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration));

        // Register application services using existing extension methods
        builder.Services
            .AddDatabase(builder.Configuration)
            .AddIdentityConfig()
            .AddJwtAuthentication(builder.Configuration)
            .AddDynamicAuthorization()
            .AddApplicationServices()
            .AddInfrastructureServices()
            .AddStripeIntegration(builder.Configuration)
            .AddCacheServices(builder.Configuration)
            .AddRateLimitingConfig()
            .AddCorsConfig(builder.Configuration)
            .AddSwaggerConfig()
            .AddHealthChecks();

        return builder;
    }

    public static WebApplication UseProgramPipeline(this WebApplication app)
    {
        AuditNetConfiguration.Configure(app.Services);

        // Swagger
        app.UseSwagger();
        app.UseSwaggerUI(opt =>
        {
            opt.SwaggerEndpoint("/swagger/v1/swagger.json", "YamiFlow API v1");
            opt.RoutePrefix = "swagger";
        });

        if (!app.Environment.IsDevelopment())
            app.UseHttpsRedirection();

        app.UseSerilogRequestLogging();
        app.UseCors();

        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseMiddleware<ExceptionHandlerMiddleware>();

        // Endpoints
        app.MapAllEndpoints();
        app.MapHealthChecks("/health");

        return app;
    }
}

