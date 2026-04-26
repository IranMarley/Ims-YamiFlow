using Audit.Core;
using Audit.EntityFramework;
using Audit.EntityFramework.ConfigurationApi;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Infrastructure.IAM;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RequestAudit = Ims.YamiFlow.Domain.Entities.Audit;

namespace Ims.YamiFlow.Infrastructure.Persistence.Context;

[AuditDbContext(Mode = AuditOptionMode.OptOut)]
public class AppDbContext : IdentityDbContext<AppUser, AppRole, string>, IAuditDbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        IHttpContextAccessor? httpContextAccessor = null)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<LessonProgress> LessonProgresses => Set<LessonProgress>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ForumPost> ForumPosts => Set<ForumPost>();
    public DbSet<ForumReply> ForumReplies => Set<ForumReply>();
    public DbSet<RequestAudit> Audits => Set<RequestAudit>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AuthEvent> AuthEvents => Set<AuthEvent>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<StripeWebhookEvent> StripeWebhookEvents => Set<StripeWebhookEvent>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<VideoProcessingJob> VideoProcessingJobs => Set<VideoProcessingJob>();
    public DbSet<VideoAsset> VideoAssets => Set<VideoAsset>();

    private readonly DbContextHelper _auditHelper = new();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
        => _auditHelper.SaveChanges(this, () => base.SaveChanges(acceptAllChangesOnSuccess));

    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        SetAuditExtraFields();
        return await _auditHelper.SaveChangesAsync(
            this,
            () => base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken));
    }

    private void SetAuditExtraFields()
    {
        var httpContext = _httpContextAccessor?.HttpContext;
        if (httpContext is null) return;

        var userId = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userName = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();

        ExtraFields["Source"] = "API";
        if (userId is not null) ExtraFields["UserId"] = userId;
        if (userName is not null) ExtraFields["UserName"] = userName;
        if (ipAddress is not null) ExtraFields["IpAddress"] = ipAddress;
    }

    // ── IAuditDbContext ────────────────────────────────────────────

    DbContext IAuditDbContext.DbContext => this;
    public string AuditEventType { get; set; } = "{context}:{database}";
    public bool AuditDisabled { get; set; }
    public bool IncludeEntityObjects { get; set; }
    public AuditOptionMode Mode { get; set; } = AuditOptionMode.OptOut;
    public bool ExcludeValidationResults { get; set; }
    public bool EarlySavingAudit { get; set; }
    public bool ExcludeTransactionId { get; set; }
    public bool ReloadDatabaseValues { get; set; }
    public Dictionary<string, object> ExtraFields { get; } = new();
    public Dictionary<Type, EfEntitySettings>? EntitySettings { get; set; }
    public IAuditScopeFactory? AuditScopeFactory { get; set; }

    AuditDataProvider? IAuditDbContext.AuditDataProvider
    {
        get => null;
        set { }
    }

    public void OnScopeCreated(IAuditScope auditScope) { }
    public void OnScopeSaving(IAuditScope auditScope) { }
    public void OnScopeSaved(IAuditScope auditScope) { }
}
