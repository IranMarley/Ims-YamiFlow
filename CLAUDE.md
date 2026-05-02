# CLAUDE.md

Guidance for Claude Code working with this repository.

## Project Overview

**Ims.YamiFlow**: Full-featured LMS. .NET 10, Clean Architecture + CQRS (custom `IHandler<TRequest, TResponse>`, no MediatR). Direct DI injection into endpoint lambdas. **All code, comments, XML docs, variable names in English only** (Portuguese only in user-facing message strings).

## Build & Run

```bash
dotnet restore
dotnet build Ims.YamiFlow.sln
dotnet test Ims.YamiFlow.sln
dotnet ef migrations add <Name> --project ../Ims.YamiFlow.Infrastructure
dotnet ef database update
dotnet run --project src/Ims.YamiFlow.API
```

Swagger: `https://localhost:{port}/swagger`. Health: `GET /health`.

## Architecture

```
src/
  Ims.YamiFlow.API            → Minimal API, middleware, DI
  Ims.YamiFlow.Application    → Commands, Queries, Handlers, Validators
  Ims.YamiFlow.Domain         → Entities, Enums, Interfaces (zero deps)
  Ims.YamiFlow.Infrastructure → EF Core, Dapper, Identity, JWT, Repos
tests/ → Domain.Tests, Application.Tests, Integration.Tests (scaffold)
```

**Dependency rule:** API → Application + Infrastructure → Domain.

| Stack | Tech |
|---|---|
| API | ASP.NET Core Minimal API (.NET 10) |
| CQRS | Custom `IHandler<TRequest, TResponse>` |
| Write ORM | EF Core 10 + Npgsql |
| Read ORM | Dapper 2.1 |
| Auth | ASP.NET Identity + JWT + Google/Facebook OAuth2 |
| Validation | FluentValidation |
| Logging | Serilog + Grafana Loki |
| Observability | OpenTelemetry (OTLP, Prometheus) |
| Cache | Redis / IMemoryCache |
| DB | PostgreSQL |
| Payments | Stripe.net 47 |
| Audit | Audit.NET EF 25 |

## Key Patterns

**CQRS:** One file per feature: Command/Query record + Validator + Handler. Reads use Dapper, writes use EF + UnitOfWork. Handlers implement `IHandler<TRequest, TResponse>`, injected directly into endpoint lambdas.

**Result pattern:** All handlers return `Result<T>` or `PagedResult<T>` — never throw on business failures.

**Validation:** `ValidationFilter` runs FluentValidation before handler. Throws `ValidationException` → `ExceptionHandlerMiddleware` maps to 400.

**Endpoints:** Static class with `Map()` method, one file per endpoint, registered in `EndpointExtensions`.

```csharp
public static class CreateCourseEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/courses", handler)
            .RequireAuthorization(x => x.RequireClaim("Course", "Create"));
    }
}
```

## IAM & Authorization

Native ASP.NET Identity (no custom permission entities):
- Roles: Admin, Instructor, Student
- Permissions: `Claim(resource, operation)` — type is resource (e.g. `"Course"`), value is operation (e.g. `"Create"`)
- JWT carries individual resource claims, not single `"permission"` claim

**MUST use:**
```csharp
.RequireAuthorization(x => x.RequireClaim("Resource", "Operation"))
```

**Never:** `.RequireAuthorization(policyName)` or `.RequireClaim()` alone.

JWT payload:
```json
{
  "sub": "user-id",
  "email": "user@email.com",
  "role": ["Instructor"],
  "Course": ["Create", "Read", "Update"],
  "Lesson": ["Create", "Read", "Delete"]
}
```

Roles auto-seeded via `IamSeed`. Default roles: Admin, Instructor, Student.

**Resources (16):** Auth, Course, Module, Lesson, Enrollment, Certificate, Quiz, Review, Forum, Coupon, Payment, Subscription, Affiliate, Instructor, Notification, Role, User.  
**Operations:** Create, Read, Update, Delete (not all apply to all resources — see `Resources.cs`).

**Custom auth:** `ActiveSubscriptionRequirement` — `Course.IsFree == true` OR active/trialing subscription on course endpoints.

## Domain Model

Entities have private setters; all mutations via methods. Business rules inside entities.

| Entity | Key methods |
|---|---|
| `Course` | `Create()`, `AddModule()`, `Publish()`, `Archive()`, `Update()`, `TotalDuration()` |
| `Module` | `Create()`, `AddLesson()`, `RemoveLesson()`, `UpdateTitle()`, `FindLesson()` |
| `Lesson` | `Create()`, `Update()`, `SetLessonType()`, `TogglePublished()` |
| `Enrollment` | `Create()`, `CompleteLesson()`, `CalculateProgress()`, `IsEligibleForCertificate()`, `Complete()`, `Cancel()` |
| `Certificate` | `Create()`, `Verify()` |
| `Coupon` | `Create()`, `IsValid()`, `Apply()`, `Deactivate()` |
| `Review` | `Create()`, `Update()`, `Delete()` — 1–5 rating, one per student per course |
| `ForumPost` | `Create()`, `AddReply()`, `Delete()` |
| `Subscription` | `Create()`, `SyncFromStripe()`, `MarkCanceled()`, `GrantsAccess()` |
| `Payment` | `Create()`, `MarkProcessed()`, `MarkFailed()` |
| `OutboxMessage` | `Create()`, `MarkProcessing()`, `MarkProcessed()` — async email queue |

Hierarchy: `Course` → `Module` → `Lesson`; `Enrollment` → `LessonProgress`, `Certificate`.

Enums: `CourseStatus`, `CourseLevel`, `EnrollmentStatus`, `LessonType`, `CouponType`, `PaymentStatus`, `SubscriptionStatus`, `BillingInterval`.

## Authentication Endpoints

| Endpoint | Behavior |
|---|---|
| `POST /api/auth/register` | Register, Student role, confirmation email |
| `POST /api/auth/login` | JWT + refresh token |
| `POST /api/auth/logout` | Invalidate refresh token |
| `POST /api/auth/refresh-token` | New JWT |
| `POST /api/auth/forgot-password` | Reset email |
| `POST /api/auth/reset-password` | Password reset |
| `POST /api/auth/change-password` | Auth required |
| `POST /api/auth/confirm-email` | Email confirmation |
| `PUT /api/auth/profile` | Update profile |
| `GET /api/auth/external-login/{provider}` | Google/Facebook OAuth2 |
| `GET /api/auth/external-login-callback` | OAuth callback — link or create account |

Social login: email exists → link accounts; new → create, Student role, skip confirmation.

## Configuration

Required `appsettings.json` keys: `ConnectionStrings.DefaultConnection`, `JwtSettings` (Secret ≥32 chars, ExpirationHours, RefreshTokenExpirationDays), `Authentication` (Google/Facebook), `Email` (SMTP), `Stripe` (keys), `Cors.Origins`, `AppUrl`, `LOKI_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`.

Dev uses `appsettings.Development.json` with `yamflow_dev` DB, debug logging.

Stripe plan IDs seeded via `SeedExtensions`. Frontend env: `NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID`, `NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID`.

## What Is Implemented

**Complete:** Domain entities, ASP.NET Identity + JWT + refresh, Auth (register/login/logout/refresh/password reset/confirm/profile), Social login (Google/Facebook), IAM (roles/permissions), Courses (CRUD/publish/archive/promo), Modules (add/update/delete/reorder), Lessons (add/update/delete/reorder/move), Enrollments (enroll w/ coupon/cancel/progress), Certificates (issue/verify), Reviews (CRUD), Forum (posts/replies/delete), Coupons (CRUD/validate), Course promotions, Admin dashboard (stats/users), Instructor dashboard (courses/stats/revenue), Audit trail (Audit.NET), Dapper read queries, Subscriptions (checkout/cancel/resume/Stripe webhook), Payments (history), OpenTelemetry, Serilog + Loki, Email (Outbox), Video (upload/HLS 360/720/1080/stream).

**Stub:** InitiatePayment, Quizzes (models/validators done, handlers don't persist), Notifications, Affiliates.

## Database Migrations

All in `Infrastructure/Migrations/`:

| Migration | Content |
|---|---|
| `InitialCreate` | Core schema |
| `AddReviewsForumPromotion` | Reviews, forum, promo fields |
| `AddAuditTable` | Audit tracking |
| `AddSubscriptionsAndPayments` | Subscriptions, Course.IsFree, payments |
| `AddOutboxMessages` | Outbox with Status/CreatedAt indexes |

## Audit.NET Integration (Critical)

Audit.NET EF v25: `entry.Name` uses `IEntityType.DisplayName()` (CLR type), **not database table name**.

**Fix in `PostgresAuditDataProvider.BuildTableNameMap`:** builds `DisplayName() → GetTableName()` dictionary, maps before insert/update.

**Do NOT fix in `AppDbContext.OnScopeSaving`** — Audit.NET repopulates after hook, overwriting changes.

**Audit `Source` field:**
- HTTP: `AppDbContext.SetAuditExtraFields()` sets `ExtraFields["Source"] = "API"`
- Workers: set `db.ExtraFields["Source"] = "OutboxWorker"` or `"VideoProcessingWorker"` (never disable audit)
- Fallback: `"System"`

Identity DisplayName → Table:
- `AppUser` → `AspNetUsers`
- `AppRole` → `AspNetRoles`
- `IdentityUserRole<string>` → `AspNetUserRoles`
- `IdentityUserClaim<string>` → `AspNetUserClaims`
- `IdentityRoleClaim<string>` → `AspNetRoleClaims`
- `IdentityUserLogin<string>` → `AspNetUserLogins`
- `IdentityUserToken<string>` → `AspNetUserTokens`

## Subscription Model (Stripe) (Critical)

**Netflix-style:** no per-course purchases. Access rule: `Course.IsFree == true` OR active/trialing subscription.

Stripe.net v47 endpoints:
- `POST /api/subscriptions/subscribe` → `{ clientSecret, publishableKey }` or empty (simulate)
- `POST /api/subscriptions/cancel` → `CancelAtPeriodEnd`
- `POST /api/subscriptions/resume` → un-cancel
- `GET /api/subscriptions/current` → current `Subscription` or `null`
- `GET /api/subscriptions/plans` → list (anonymous)
- `POST /api/webhooks/stripe` → webhook handler

**Simulate mode** (empty `Stripe.SecretKey`): creates `sim_sub_*` local subscription, skips Stripe API call. Detection: `string.IsNullOrEmpty(stripe.PublishableKey)` or `sub.StripeSubscriptionId.StartsWith("sim_")`.

**Stripe.net v47 API breaking changes:**
- `Subscription.CurrentPeriodEnd` → moved to `SubscriptionItem` via `sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd`
- `Invoice.SubscriptionId` → removed, use `invoice.Parent?.SubscriptionDetails?.SubscriptionId`

`SubscriptionStatus` enum: `Active`, `Cancelled`, `Expired`, `Trialing`, `PastDue`.

`ICourseAccessService.CanAccessAsync(userId, courseId)` — single Dapper query checks free + subscription.

## Outbox Pattern (Email) (Critical)

**Never call `IEmailService.SendAsync` directly from handlers.** Always use Outbox.

Flow: Handler → `IOutboxService.EnqueueAsync(type, payload, ct)` → `OutboxMessage` (Pending) saved → `OutboxWorker` polls every 10s → `SELECT FOR UPDATE SKIP LOCKED` → deserialize → send → mark Processed/Failed.

Files:
- `Domain/Entities/OutboxMessage.cs` — entity, `OutboxStatus` (Pending/Processing/Processed/Failed)
- `Domain/Interfaces/IExternalServices.cs` — `IOutboxService`
- `Application/Common/OutboxMessageTypes.cs` — type constants + payload records
- `Infrastructure/Services/Outbox/OutboxService.cs` — scoped serializer
- `Infrastructure/Services/Outbox/OutboxWorker.cs` — singleton, sets `db.ExtraFields["Source"] = "OutboxWorker"`

Adding new email type:
1. Add constant + payload record to `OutboxMessageTypes`
2. Add `case` to `OutboxWorker.DispatchAsync`
3. Enqueue: `outboxService.EnqueueAsync(OutboxMessageTypes.YourType, payload, ct)`

Concurrency: `SELECT FOR UPDATE SKIP LOCKED` — no duplicate processing across workers.

## Observability

**OpenTelemetry** (`Extensions/OpenTelemetryExtensions.cs`):
- Traces: ASP.NET, EF, HttpClient, Redis → OTLP (port 4317)
- Metrics: ASP.NET, Process, Runtime, Redis → Prometheus

**Serilog** (`Extensions/LoggingExtensions.cs`):
- Enrichers: Environment, Process, Thread, Span, Exceptions
- Sinks: Console + Grafana Loki
- Label: `LOG_APP_LABEL`

## Frontend (web-client/)

Next.js 15.3.1, App Router, React 19, TypeScript, TanStack Query v5, Zustand v5.

Structure: `/app` (routes) → `/pages` (components) → `/hooks` → `/services` → `/store` (Zustand) → `/types`.

Navigation: `next/navigation` (useRouter, useParams, useSearchParams), `next/link`. No react-router.

Login redirect: `useLogin(redirectTo?)` reads `?redirect` param. Usage: `/login?redirect=/subscriptions`.

Course learning (`/courses/:id/learn`): Certificate fetched on load. Cancel button hidden at 100%.

Thumbnails: `${BASE_URL}${course.thumbnail}` with gradient fallback.

Course access: `course.isFree || hasActiveSubscription` → enroll; else → `/subscriptions`.

Key packages: next 15.3.1, react 19, @tanstack/react-query 5.56.2, zustand 5, @stripe/react-stripe-js 6.2, axios 1.7.7, zod 3.23.8.

## Adding New Features

- **Command:** `Application/Commands/{Feature}/` — single file: `{Action}Command` record + `{Action}Validator` + `{Action}Handler` (implements `IHandler<TCommand, Result<TResponse>>`).
- **Query:** `Application/Queries/{Feature}/` — same pattern; handler uses Dapper.
- **Endpoint:** Static class in `API/Endpoints/{Feature}/`, register in `EndpointExtensions`.
- **Repository:** Interface in `Domain/Interfaces/`, impl in `Infrastructure/Persistence/Repositories/`, register in `ServiceExtensions`.
- **Permission:** Add to `Application/IAM/Constants/Resources.cs`, wire in `IamSeed`.
- **Migration:** `dotnet ef migrations add <Name> --project ../Ims.YamiFlow.Infrastructure` from `src/Ims.YamiFlow.API`.

## Docker / Development (Gotchas)

**Rider:** Uses build stage only (`target: "build"` in docker-compose.generated.override.yml). Runtime stage for production. Tools in runtime stage unavailable locally.

**Image names:** Rider tags `ims.yamiflow.api:dev`. Compose tags `ims-yamiflow-api:latest` (different — doesn't affect Rider). Rebuild: restart Rider run config or `docker build --target build -t ims.yamiflow.api:dev .`

**ffmpeg:** Build stage installed via apt (`/usr/bin/ffmpeg`). Config: `Ffmpeg.FfmpegPath = "/usr/bin/ffmpeg"` in appsettings.

**EF Core new-entity pitfall:** When adding entities to private backing collections on aggregate root, EF Core may track as `Modified` (not `Added`). **Always call `db.Set<T>().Add(entity)` explicitly via repo** — never rely on graph traversal with non-default Guid keys.

**DI registration:** `AddApplicationServices` registers `IHandler<,>` impls as concrete types only (not `AddScoped<IHandler<TCmd,TResp>, THandler>`). Endpoint lambdas inject concrete handler class, not interface.
