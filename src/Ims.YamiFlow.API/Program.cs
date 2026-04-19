using Ims.YamiFlow.API.Extensions;
using Ims.YamiFlow.Infrastructure.Audit;
using Serilog;

// ── Bootstrap logger ──────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Configure services via extension
    builder.AddProgramServices();

    // ── Build ─────────────────────────────────────────────────────
    var app = builder.Build();

    // Configure Audit.NET before seed so EF operations use the Postgres provider
    AuditNetConfiguration.Configure(app.Services);

    // ── Seed ──────────────────────────────────────────────────────
    await app.MigrateAndSeedAsync();

    // Configure pipeline via extension
    app.UseProgramPipeline();

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly.");
}
finally
{
    await Log.CloseAndFlushAsync();
}
