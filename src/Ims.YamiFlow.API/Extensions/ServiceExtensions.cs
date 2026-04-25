using System.Text;
using FluentValidation;
using Ims.YamiFlow.Application.Commands.Auth;
using Ims.YamiFlow.Application.Common;

using Ims.YamiFlow.Infrastructure.IAM;
using Ims.YamiFlow.Infrastructure.Persistence;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Ims.YamiFlow.Infrastructure.Persistence.Repositories;
using Ims.YamiFlow.Infrastructure.Services;
using Ims.YamiFlow.Infrastructure.Services.Email;
using Ims.YamiFlow.Infrastructure.Services.Media;
using Ims.YamiFlow.Infrastructure.Services.Outbox;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddDatabase(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseNpgsql(config.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.MigrationsAssembly(
                    typeof(AppDbContext).Assembly.FullName)));

        return services;
    }

    public static IServiceCollection AddIdentityConfig(this IServiceCollection services)
    {
        // AddIdentityCore avoids overriding the default auth scheme with cookies.
        // JWT is configured separately in AddJwtAuthentication.
        services
            .AddIdentityCore<AppUser>(opt =>
            {
                opt.Password.RequiredLength = 8;
                opt.Password.RequireNonAlphanumeric = false;
                opt.User.RequireUniqueEmail = true;
            })
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, IConfiguration config)
    {
        var jwt = config.GetSection("JwtSettings");
        var secret = jwt["Secret"]!;

        services
            .AddAuthentication(opt =>
            {
                opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(opt =>
            {
                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt["Issuer"],
                    ValidAudience = jwt["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                                                Encoding.UTF8.GetBytes(secret))
                };
            });

        return services;
    }

    public static IServiceCollection AddDynamicAuthorization(this IServiceCollection services)
    {
        // Endpoints use inline .RequireAuthorization(x => x.RequireClaim("Resource", "Operation"))
        // FallbackPolicy = null ensures endpoints without auth metadata are publicly accessible.
        // AllowAnonymous() on individual endpoints bypasses all authorization checks.
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = null;
            options.AddPolicy(Authorization.ActiveSubscriptionRequirement.PolicyName, p =>
            {
                p.RequireAuthenticatedUser();
                p.AddRequirements(new Authorization.ActiveSubscriptionRequirement());
            });
        });
        services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler,
            Authorization.ActiveSubscriptionHandler>();
        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register all IHandler<,> implementations from the Application assembly as scoped services.
        // Each endpoint lambda injects its specific handler type directly — no dispatcher needed.
        var appAssembly = typeof(RegisterCommand).Assembly;
        foreach (var type in appAssembly.GetTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface
                && t.GetInterfaces().Any(i =>
                    i.IsGenericType
                    && i.GetGenericTypeDefinition() == typeof(Ims.YamiFlow.Application.Common.IHandler<,>))))
        {
            services.AddScoped(type);
        }

        services.AddValidatorsFromAssemblyContaining<RegisterValidator>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services, IConfiguration config)
    {
        services.Configure<EmailOptions>(config.GetSection(EmailOptions.SectionName));

        // Services (Application / Domain)
        services.AddScoped<IAuthUserService, AuthUserService>();
        services.AddScoped<IIamService, IamService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddScoped<IOutboxService, OutboxService>();
        services.AddScoped<IAuthEventService, AuthEventService>();

        services.AddHttpContextAccessor();

        // Repositories (Data Access)
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();
        services.AddScoped<ICertificateRepository, CertificateRepository>();
        services.AddScoped<ICouponRepository, CouponRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IForumPostRepository, ForumPostRepository>();
        services.AddScoped<ISubscriptionPlanRepository, SubscriptionPlanRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IStripeWebhookEventRepository, StripeWebhookEventRepository>();

        // Infrastructure
        services.AddScoped<IDbConnectionFactory, NpgsqlConnectionFactory>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Seed / Initialization
        services.AddScoped<IamSeed>();

        // Background workers
        services.AddHostedService<OutboxWorker>();
        services.AddHostedService<VideoProcessingWorker>();

        return services;
    }

    public static IServiceCollection AddMediaServices(
        this IServiceCollection services, IConfiguration config)
    {
        services.Configure<StorageOptions>(config.GetSection(StorageOptions.SectionName));
        services.Configure<FfmpegOptions>(config.GetSection(FfmpegOptions.SectionName));

        services.AddScoped<IStorageService, LocalStorageService>();
        services.AddScoped<FFmpegService>();

        services.AddScoped<IVideoProcessingJobRepository, VideoProcessingJobRepository>();
        services.AddScoped<IVideoAssetRepository, VideoAssetRepository>();

        return services;
    }

    public static IServiceCollection AddStripeIntegration(
        this IServiceCollection services, IConfiguration config)
    {
        services.Configure<Ims.YamiFlow.Infrastructure.Services.Stripe.StripeOptions>(
            config.GetSection(Ims.YamiFlow.Infrastructure.Services.Stripe.StripeOptions.SectionName));
        services.AddScoped<IStripeService, Ims.YamiFlow.Infrastructure.Services.Stripe.StripeService>();
        services.AddScoped<IStripeWebhookProcessor, Ims.YamiFlow.Infrastructure.Services.Stripe.StripeWebhookProcessor>();
        services.AddScoped<Ims.YamiFlow.Application.Commands.Subscriptions.IUserStripeCustomerService,
            Ims.YamiFlow.Infrastructure.Services.Stripe.UserStripeCustomerService>();
        return services;
    }

    public static IServiceCollection AddCacheServices(
        this IServiceCollection services, IConfiguration config)
    {
        var redis = config.GetConnectionString("Redis");

        if (!string.IsNullOrEmpty(redis))
            services.AddStackExchangeRedisCache(opt => opt.Configuration = redis);
        else
            services.AddMemoryCache();

        return services;
    }

    public static IServiceCollection AddRateLimitingConfig(this IServiceCollection services)
    {
        // Global token-bucket limiter partitioned by authenticated user id or by remote IP when not authenticated.
        // Keeps existing named fixed-window limiters as additional policies.
        services.AddRateLimiter(options =>
        {
            // Global limiter using token-bucket per-user-or-ip
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                // Prefer authenticated user's unique id, fallback to remote IP
                var isAuthenticated = httpContext.User.Identity?.IsAuthenticated == true;

                // Prefix partitions so we can apply different limits for anonymous vs authenticated
                string partitionKey;

                if (isAuthenticated)
                {
                    var claim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)
                                ?? httpContext.User.FindFirst("sub");
                    var userId = claim?.Value ?? "unknown";
                    partitionKey = RateLimitPolicies.UserPartitionPrefix + userId;
                }
                else
                {
                    var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    partitionKey = RateLimitPolicies.AnonymousPartitionPrefix + ip;
                }

                // Partition by key and give different token-bucket options depending on anonymous vs authenticated
                return RateLimitPartition.GetTokenBucketLimiter(partitionKey, key =>
                {
                    // If anonymous (prefix), apply a stricter, smaller bucket
                    if (key.StartsWith(RateLimitPolicies.AnonymousPartitionPrefix))
                    {
                        return new TokenBucketRateLimiterOptions
                        {
                            TokenLimit = 20,
                            TokensPerPeriod = 10,
                            ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0,
                            AutoReplenishment = true
                        };
                    }

                    // Authenticated users get a larger bucket
                    return new TokenBucketRateLimiterOptions
                    {
                        TokenLimit = 100,
                        TokensPerPeriod = 50,
                        ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0,
                        AutoReplenishment = true
                    };
                });
             });

            // Keep existing named policies for more specific endpoints
            options.AddFixedWindowLimiter(RateLimitPolicies.Default, cfg =>
            {
                cfg.PermitLimit = 100;
                cfg.Window = TimeSpan.FromMinutes(1);
                cfg.QueueLimit = 10;
            });

            options.AddFixedWindowLimiter(RateLimitPolicies.Auth, cfg =>
            {
                cfg.PermitLimit = 10;
                cfg.Window = TimeSpan.FromMinutes(1);
            });

            // Set a global rejection status code
            options.RejectionStatusCode = 429;
        });

        return services;
    }

    public static IServiceCollection AddCorsConfig(
        this IServiceCollection services, IConfiguration config)
    {
        var origins = config.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "*" };

        services.AddCors(opt =>
            opt.AddDefaultPolicy(policy =>
                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()));

        return services;
    }

    public static IServiceCollection AddSwaggerConfig(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(opt =>
        {
            opt.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Ims.YamiFlow API",
                Version = "v1",
                Description = "Online course platform API"
            });

            opt.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Enter JWT token"
            });

            opt.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}
