# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ims.YamiFlow** is a full-featured online course platform (LMS) built with Clean Architecture + CQRS on .NET 10. No MediatR — uses a custom `IHandler<TRequest, TResponse>` with direct DI. All code, comments, XML docs, and variable names must be in **English** — no Portuguese anywhere in code (only acceptable in user-facing message strings).

## Build & Run

```bash
# Restore packages
dotnet restore

# Build solution
dotnet build Ims.YamiFlow.sln

# Run tests (all or single project)
dotnet test Ims.YamiFlow.sln
dotnet test tests/Ims.YamiFlow.Domain.Tests
dotnet test tests/Ims.YamiFlow.Application.Tests
dotnet test tests/Ims.YamiFlow.Integration.Tests

# EF Core migrations (run from src/Ims.YamiFlow.API)
dotnet ef migrations add <MigrationName> --project ../Ims.YamiFlow.Infrastructure
dotnet ef database update

# Run the API
dotnet run --project src/Ims.YamiFlow.API
```

Swagger available at `https://localhost:{port}/swagger`. Health check at `GET /health`.

## Architecture

```
src/
  Ims.YamiFlow.API            → Minimal API endpoints, middleware, DI wiring
  Ims.YamiFlow.Application    → Commands, Queries, Handlers, Validators, Behaviors, IAM
  Ims.YamiFlow.Domain         → Entities, Enums, Interfaces, Exceptions (zero external deps)
  Ims.YamiFlow.Infrastructure → EF Core, Dapper, Identity, JWT, Repositories, Seeding
tests/
  Ims.YamiFlow.Domain.Tests        (scaffold only)
  Ims.YamiFlow.Application.Tests   (scaffold only)
  Ims.YamiFlow.Integration.Tests   (scaffold only)
```

**Dependency rule:** API → Application + Infrastructure → Domain → nothing.

| Responsibility | Technology |
|---|---|
| Framework | ASP.NET Core Minimal API (.NET 10) |
| CQRS | Custom `IHandler<TRequest, TResponse>` — no MediatR |
| ORM (writes) | EF Core 10.0.5 + Npgsql 10.0.1 |
| ORM (reads) | Dapper 2.1.72 |
| Auth | ASP.NET Identity + JWT Bearer |
| Social Login | Google + Facebook OAuth2 |
| Validation | FluentValidation 12.1.1 |
| Logging | Serilog 10.0.0 + Grafana Loki sink |
| Observability | OpenTelemetry (OTLP, Prometheus, traces) |
| Cache | Redis (StackExchange.Redis 2.12.14) / IMemoryCache |
| Database | PostgreSQL |
| Payments | Stripe.net 47.0.0 |
| Audit | Audit.NET EF 25.0.4 |

## Key Patterns

**CQRS**: Commands and Queries each live in their own folder — one file per feature containing the record, validator, and handler together. Reads use Dapper; writes use EF Core repositories + UnitOfWork. Handlers implement `IHandler<TRequest, TResponse>` and are injected directly into endpoint lambdas — no dispatcher.

**Result pattern**: All handlers return `Result<T>` or `PagedResult<T>` — never throw for business failures.

**Validation**: `ValidationFilter` (endpoint filter) runs FluentValidation on every bound request argument before the handler executes. Throws `ValidationException` on failure — `ExceptionHandlerMiddleware` maps this to 400.

**Endpoint structure**: Each endpoint is a static class with a `Map` method. Register in `EndpointExtensions`.

```csharp
public static class CreateCourseEndpoint
{
    public static void Map(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/courses", async (...) => { ... })
            .RequireAuthorization(x => x.RequireClaim("Course", "Create"))
            .WithTags("Courses")
            .WithName("CreateCourse");
    }
}
```

Each endpoint lives in its own file (e.g., `CreateCourseEndpoint.cs`) inside the matching folder.

## IAM & Authorization

Uses native ASP.NET Identity — no custom permission entities:
- `IdentityRole` → Role (Admin, Instructor, Student)
- `IdentityRoleClaim` → Permission (type: resource, value: operation)
- `IdentityUserRole` → User → Role assignment

**Always use `.RequireAuthorization(x => x.RequireClaim(...))` — never `.RequireAuthorization(policyName)` or `.RequireClaim()`:**

```csharp
app.MapPost("/api/courses", handler).RequireAuthorization(x => x.RequireClaim("Course", "Create"));
app.MapGet("/api/courses", handler).RequireAuthorization(x => x.RequireClaim("Course", "Read"));
```

Permissions are stored as `Claim(resource, operation)` — e.g. type `"Course"`, value `"Create"`. The JWT carries individual resource claims, not a single `"permission"` claim:

```json
{
  "sub": "user-id",
  "email": "user@email.com",
  "role": ["Instructor"],
  "Course": ["Create", "Read", "Update"],
  "Lesson": ["Create", "Read", "Update", "Delete"]
}
```

Roles are always called **Roles** (not profiles) in code, API routes, and documentation. Default roles are auto-seeded at startup via `IamSeed`.

**Resources (16):** Auth, Course, Module, Lesson, Enrollment, Certificate, Quiz, Review, Forum, Coupon, Payment, Subscription, Affiliate, Instructor, Notification, Role, User  
**Operations:** Create, Read, Update, Delete (not all ops apply to every resource — see `Resources.cs`)

**Custom authorization:** `ActiveSubscriptionRequirement` — checks `Course.IsFree == true` OR user has active/trialing subscription. Used on course access endpoints.

## Domain Model

Entities and their key behaviors:

| Entity | Behavior methods |
|---|---|
| `Course` | `Create()`, `AddModule()`, `RemoveModule()`, `Publish()`, `Archive()`, `Update()`, `TotalDuration()` |
| `Module` | `Create()`, `AddLesson()`, `RemoveLesson()`, `UpdateTitle()`, `FindLesson()` |
| `Lesson` | `Create()`, `Update()`, `SetLessonType()`, `TogglePublished()` |
| `Enrollment` | `Create()`, `CompleteLesson()`, `CalculateProgress()`, `IsEligibleForCertificate()`, `AddOrUpdateProgress()`, `Complete()`, `Cancel()` |
| `LessonProgress` | `Create()`, `UpdateWatchedSeconds()` |
| `Certificate` | `Create()`, `Verify()` |
| `Coupon` | `Create()`, `IsValid()`, `Apply()`, `Deactivate()` |
| `Review` | `Create()`, `Update()`, `Delete()` — rating 1–5; one per enrolled student per course |
| `ForumPost` | `Create()`, `AddReply()`, `Delete()` — nested replies |
| `Subscription` | `Create()`, `SyncFromStripe()`, `MarkCanceled()`, `GrantsAccess()` |
| `SubscriptionPlan` | `Create()`, `Update()`, `Deactivate()` |
| `Payment` | `Create()`, `MarkProcessed()`, `MarkFailed()` |
| `StripeWebhookEvent` | `Create()`, `MarkProcessed()` |
| `Audit` / `AuditLog` | Change tracking (entity, action, userId, timestamp) |
| `AuthEvent` | Authentication event tracking |
| `OutboxMessage` | `Create()`, `MarkProcessing()`, `MarkProcessed()`, `MarkFailed()` — async email queue |

Hierarchy: `Course` → `Module` → `Lesson`; `Enrollment` → `LessonProgress`, `Certificate`.

Enums: `CourseStatus`, `CourseLevel`, `EnrollmentStatus`, `LessonType`, `CouponType`, `PaymentStatus`, `NotificationType`, `SubscriptionStatus`, `BillingInterval`.

Domain entities have private setters; all mutations go through methods. Business rules live inside entities.

## Authentication Endpoints

All auth flows use ASP.NET Identity:

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Register, assign Student role, send confirmation email |
| `POST /api/auth/login` | Email + password → JWT + refresh token |
| `POST /api/auth/logout` | Invalidate refresh token |
| `POST /api/auth/refresh-token` | New JWT from refresh token |
| `POST /api/auth/forgot-password` | Send reset email with token |
| `POST /api/auth/reset-password` | Reset password using token |
| `POST /api/auth/change-password` | Authenticated password change |
| `POST /api/auth/confirm-email` | Confirm email with token |
| `POST /api/auth/resend-confirmation` | Resend confirmation email |
| `PUT /api/auth/profile` | Update profile (authenticated) |
| `GET /api/auth/external-login/{provider}` | Initiate Google/Facebook OAuth2 |
| `GET /api/auth/external-login-callback` | OAuth2 callback — create/link account, return JWT |

Social login: if email already exists → link accounts; if new → create user, assign Student role, skip email confirmation.

## Configuration

Required `appsettings.json` keys:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=yamflow;...",
    "Redis": ""
  },
  "JwtSettings": {
    "Secret": "STRONG_SECRET_MIN_32_CHARS",
    "Issuer": "Ims.YamiFlow",
    "Audience": "Ims.YamiFlow.Clients",
    "ExpirationHours": 8,
    "RefreshTokenExpirationDays": 30
  },
  "Authentication": {
    "Google": { "ClientId": "", "ClientSecret": "" },
    "Facebook": { "AppId": "", "AppSecret": "" }
  },
  "Email": {
    "From": "noreply@yamflow.com",
    "SmtpHost": "", "SmtpPort": 587,
    "SmtpUser": "", "SmtpPass": ""
  },
  "Stripe": {
    "SecretKey": "sk_...",
    "PublishableKey": "pk_...",
    "WebhookSecret": "whsec_..."
  },
  "Cors": {
    "Origins": ["http://localhost:3000", "http://localhost:5173"]
  },
  "AppUrl": "http://localhost:3000",
  "LOKI_URL": "http://localhost:3100",
  "LOG_APP_LABEL": "yamiflow-api",
  "OTEL_SERVICE_NAME": "yamiflow-api",
  "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317"
}
```

`appsettings.Development.json` uses `yamflow_dev` database, debug logging, and EF SQL logging.

**Note:** Stripe plan IDs are seeded via `SeedExtensions` (not stored in appsettings). Frontend uses `NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID` and `NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID` env vars.

## What Is Implemented

| Area | Status | Notes |
|---|---|---|
| Domain entities + behaviors | Complete | |
| ASP.NET Identity + JWT + Refresh tokens | Complete | |
| Auth: Register, Login, Refresh, Logout, Password reset, Email confirm, Profile update | Complete | |
| Social login: Google + Facebook OAuth2 | Complete | Links existing account if email matches |
| IAM: Roles, Permissions, AssignRole/RemoveRole | Complete | |
| Courses: Create, Update, Publish, Archive, SetPromotion, List, Detail | Complete | |
| Modules: Add, Update, Delete, Reorder | Complete | |
| Lessons: Add, Update, Delete, Reorder, Move (cross-module), Complete, SaveProgress | Complete | `MoveLesson` moves a lesson to a different module |
| Enrollments: Enroll (with coupon), Cancel, GetMy, GetProgress | Complete | |
| Certificates: Issue, Verify, GetByEnrollment | Complete | `GET /api/enrollments/{id}/certificate` returns existing cert or 204 |
| Reviews: Create, Update, Delete, List | Complete | Requires enrollment; one per student per course |
| Forum: CreatePost, ReplyToPost, DeletePost, List, GetDetail | Complete | Delete restricted to owner or Admin |
| Coupons: Create, Delete, Validate, List | Complete | FixedAmount + Percentage types |
| Course Promotion: SetPromotion | Complete | Time-limited promotional price |
| Admin Dashboard: Stats, ListUsers, ToggleUserStatus, UpdateUser | Complete | |
| Instructor Dashboard: MyCourses, Stats, Revenue, Students | Complete | |
| Audit trail | Complete | Audit.NET EF 25.0.4 via `PostgresAuditDataProvider` |
| Dapper read queries | Complete | All queries use Dapper, not EF Core |
| Subscriptions: Checkout, Cancel, Resume, GetCurrent, ListPlans, SwitchPlan, Webhook | Complete | Stripe recurring billing (monthly + annual); simulate mode when `Stripe.SecretKey` empty |
| Payments: History | Complete | Dapper read query |
| OpenTelemetry observability | Complete | OTLP traces + Prometheus metrics |
| Serilog + Grafana Loki | Complete | Structured logging with Loki sink |
| Email service | Complete | `SmtpEmailService` + Outbox pattern — all emails enqueued asynchronously via `OutboxWorker` |
| Outbox Pattern | Complete | `OutboxMessage` entity, `IOutboxService`, `OutboxWorker` (BackgroundService) — `SELECT FOR UPDATE SKIP LOCKED` concurrency |
| Payments: InitiatePayment | Stub | Returns mock response — needs Stripe/PayPal |
| Quizzes: Create, AddQuestion, Submit, Delete, Get | Stub | Models + validators done; handlers don't persist |
| Notifications: MarkRead, MarkAllRead, List | Stub | Handlers return success without DB ops |
| Affiliates: CreateLink, GetStats | Stub | Generates code but doesn't persist |
| Video: Upload, Process (HLS), Stream, JobStatus | Complete | `VideoProcessingWorker` BackgroundService; HLS multi-rendition (360/720/1080); `GET /api/lessons/{lessonId}/video-job` for status on refresh |

## Database Migrations

All migrations in `Infrastructure` project:

| Migration | Timestamp | Content |
|---|---|---|
| `InitialCreate` | 20260411130225 | Core schema: users, courses, modules, lessons, enrollments, certificates, coupons |
| `AddReviewsForumPromotion` | 20260413061439 | Reviews, ForumPosts, Course promotional price fields |
| `AddAuditTable` | 20260416164449 | Audit change-tracking table |
| `AddAuditSchema` | 20260417125835 | Audit schema refactor |
| `RenameAuditLogEventTypeToSource` | 20260417131958 | AuditLog column rename |
| `MakeTransactionIdRequired` | 20260417132854 | TransactionId NOT NULL constraint |
| `RemovePrice` | 20260418150548 | Remove legacy price column |
| `AddSubscriptionsAndPayments` | 20260418154918 | Subscriptions table, Course.IsFree, Payment & SubscriptionPlan tables |
| `AddOutboxMessages` | 20260424155005 | OutboxMessages table with Status/CreatedAt indexes |

## Audit.NET Integration

Audit.NET EF (v25.x) populates `entry.Name` using `IEntityType.DisplayName()` — this returns the CLR type name (e.g. `AppUser`, `IdentityUserRole<string>`), **not** the database table name.

**Resolution:** `PostgresAuditDataProvider.BuildTableNameMap` builds a dictionary `DisplayName() → GetTableName()` from `AppDbContext.Model.GetEntityTypes()` and maps the name before every insert/update.

**Do not** try to fix this in `AppDbContext.OnScopeSaving` — Audit.NET repopulates the entries after that hook runs, overwriting any changes.

**Audit `Source` field:**
- HTTP requests: `AppDbContext.SetAuditExtraFields()` sets `ExtraFields["Source"] = "API"`; `PostgresAuditDataProvider` reads from `CustomFields["Source"]`
- Worker services: set `db.ExtraFields["Source"] = "OutboxWorker"` / `"VideoProcessingWorker"` — never use `db.AuditDisabled = true`; source tag is sufficient for filtering system-generated rows
- Fallback when neither HTTP context nor `Source` field present: `"System"`

Identity type → table name reference:

| CLR DisplayName | Table |
|---|---|
| `AppUser` | `AspNetUsers` |
| `AppRole` | `AspNetRoles` |
| `IdentityUserRole<string>` | `AspNetUserRoles` |
| `IdentityUserClaim<string>` | `AspNetUserClaims` |
| `IdentityRoleClaim<string>` | `AspNetRoleClaims` |
| `IdentityUserLogin<string>` | `AspNetUserLogins` |
| `IdentityUserToken<string>` | `AspNetUserTokens` |

## Subscription Model (Stripe)

The platform uses a **Netflix-style subscription** model — no per-course purchases.

**Access rule:** user can access course if `Course.IsFree == true` OR they have an active/trialing subscription.

**Stripe integration** (Stripe.net v47):
- `POST /api/subscriptions/subscribe` — creates subscription; returns `{ clientSecret, publishableKey }` for Stripe Elements or empty for simulate
- `POST /api/subscriptions/cancel` — cancels at period end via `CancelAtPeriodEnd`
- `POST /api/subscriptions/resume` — un-cancels a subscription scheduled for cancellation
- `GET /api/subscriptions/current` — returns current `Subscription` row or `null`
- `GET /api/subscriptions/plans` — lists available subscription plans (anonymous)
- `POST /api/webhooks/stripe` — handles `customer.subscription.created/updated/deleted` and `invoice.payment_failed`

**Simulate mode** (when `Stripe.SecretKey` is empty, e.g. local dev):
- `SubscribeHandler`: detects `simulate = string.IsNullOrEmpty(stripe.PublishableKey)`; creates local `sim_sub_*` subscription without calling Stripe
- `CancelSubscriptionHandler` / `ResumeSubscriptionHandler`: detects `sub.StripeSubscriptionId.StartsWith("sim_")` and skips Stripe call
- `SwitchPlanAsync` (plan change): if existing active sub found with different plan — sim subs cancel old + create new; real Stripe uses `IStripeService.SwitchPlanAsync` (updates subscription item with proration)

**Stripe.net v47 API notes:**
- `Subscription.CurrentPeriodEnd` was moved to `SubscriptionItem` — access via `sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd`
- `Invoice.SubscriptionId` removed — use `invoice.Parent?.SubscriptionDetails?.SubscriptionId`

**`SubscriptionStatus` enum:** `Active`, `Cancelled`, `Expired`, `Trialing`, `PastDue`

**`ICourseAccessService.CanAccessAsync(userId, courseId)`** — checks `Course.IsFree` OR active subscription in a single Dapper query.

**Public pricing page:** `/pricing` — unauthenticated; fetches plans via `publicApi`; "Get started" redirects to `/subscriptions` if authenticated or `/login?redirect=/subscriptions` if not.

## Observability

**OpenTelemetry** (`Extensions/OpenTelemetryExtensions.cs`):
- Traces: ASP.NET Core, EF Core, HttpClient, StackExchangeRedis → OTLP exporter (port 4317)
- Metrics: ASP.NET Core, Process, Runtime, StackExchangeRedis → Prometheus exporter

**Serilog** (`Extensions/LoggingExtensions.cs`):
- Enrichers: Environment, Process, Thread, Span, Exceptions
- Sinks: Console + Grafana Loki (`LOKI_URL`)
- Label: `LOG_APP_LABEL`

## Frontend (web-client/)

Located at `/web-client/` — Next.js 15.3.1 App Router with TypeScript, React 19, TanStack Query v5, Zustand v5, Axios, Zod, react-hook-form.

```
web-client/src/
  app/                         → Next.js App Router (route files only — page.tsx wrappers)
    layout.tsx                 → Root layout + Providers
    providers.tsx              → QueryClientProvider + Toaster
    page.tsx                   → /  (LandingPage)
    login/page.tsx             → /login
    register/page.tsx          → /register
    forgot-password/           → /forgot-password
    reset-password/            → /reset-password
    confirm-email/             → /confirm-email
    pricing/                   → /pricing  (public — plans + subscribe CTA)
    courses/                   → /courses (public)
      [id]/                    → /courses/:id (public)
        reviews/               → /courses/:id/reviews
    (protected)/               → Auth-guarded layout
      layout.tsx               → ProtectedRoute wrapper
      dashboard/               → /dashboard
      enrollments/             → /enrollments
        my/                    → /enrollments/my
      payments/                → /payments
      subscriptions/           → /subscriptions
      subscription/
        success/               → /subscription/success  (post-Stripe redirect)
        cancelled/             → /subscription/cancelled
      courses/[id]/learn/      → /courses/:id/learn
      account/                 → /account
        profile/               → /account/profile
        change-password/       → /account/change-password (also /auth/change-password)
      admin/                   → /admin
      instructor/              → /instructor
        courses/[id]/          → /instructor/courses/:id
      forum/                   → /forum
        [id]/                  → /forum/:id
      notifications/           → /notifications
      coupons/                 → /coupons
      quizzes/                 → /quizzes
      affiliates/              → /affiliates
  pages/                       → Actual page component implementations
  hooks/                       → useAuth, useAdmin, useCourses, useEnrollments, useForum,
                                  useIam, useInstructor, useNotifications, useProfile,
                                  useReviews, useSubscription, useCoupons, useAuthRedirect
  services/                    → auth, admin, course, enrollment, forum, iam, instructor,
                                  notification, profile, review, subscription, coupon
  store/
    authStore.ts               → Zustand auth state
  types/
    auth.ts, course.ts, enrollment.ts, subscription.ts
  lib/
    axios.ts                   → Axios instance with auth interceptors
    publicApi.ts               → Unauthenticated Axios instance
    queryClient.ts             → React Query client setup
```

**Navigation:** use `useRouter`, `useParams`, `useSearchParams` from `next/navigation`; `Link` from `next/link`. No `react-router-dom`.

**Login redirect:** `useLogin(redirectTo?)` accepts optional post-login destination. `LoginPage` reads `?redirect` param and passes it. Usage: `/login?redirect=/subscriptions`.

**Header dropdown (students only):** "My subscription" link → `/subscriptions`.

**Course learning page (`/courses/:id/learn`):**
- Certificate banner appears when all lessons completed; `useEnrollmentCertificate(enrollmentId)` fetches existing cert on load (`GET /api/enrollments/{id}/certificate` returns 200 with cert or 204 no content); "Generate certificate" button hidden if cert already exists
- Enrollment cancel button hidden in `MyEnrollmentsPage` when `progressPercent === 100`

**Thumbnails:** `course.thumbnail` displayed via `${BASE_URL}${course.thumbnail}` in `DashboardPage` (Featured Courses) and `LandingPage` (Featured courses card). Falls back to gradient placeholder when null.

**Frontend env vars:**
```
NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID=price_...
NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID=price_...
```

**Course access in UI:** `course.isFree || hasActiveSubscription` → enroll/start learning; otherwise → redirect to `/subscriptions`.

**Key package versions:**
- next: 15.3.1, react: 19.0.0
- @tanstack/react-query: 5.56.2, zustand: 5.0.0
- @stripe/react-stripe-js: 6.2.0, @stripe/stripe-js: 9.2.0
- react-hook-form: 7.53.0, @hookform/resolvers: 3.9.0, zod: 3.23.8
- axios: 1.7.7, sonner: 2.0.7, tailwindcss: 4

## Outbox Pattern (Email)

All email sending goes through the Outbox — **never call `IEmailService.SendAsync` directly from handlers**.

**Flow:**
1. Handler calls `IOutboxService.EnqueueAsync(type, payload, ct)` → inserts `OutboxMessage` (Status = `Pending`) into DB
2. `OutboxWorker` (BackgroundService, polls every 10s) claims batch with `SELECT FOR UPDATE SKIP LOCKED`
3. Worker deserializes payload, calls `IEmailService.SendAsync`, marks `Processed` or `Failed`

**Files:**
- `Domain/Entities/OutboxMessage.cs` — entity + `OutboxStatus` constants (`Pending`, `Processing`, `Processed`, `Failed`)
- `Domain/Interfaces/IExternalServices.cs` — `IOutboxService` interface
- `Application/Common/OutboxMessageTypes.cs` — type constants (`ConfirmEmail`, `ResetPassword`) + payload records (`ConfirmEmailPayload`, `ResetPasswordPayload`)
- `Infrastructure/Services/Outbox/OutboxService.cs` — scoped; serializes + saves to DB
- `Infrastructure/Services/Outbox/OutboxWorker.cs` — singleton BackgroundService; sets `db.ExtraFields["Source"] = "OutboxWorker"` (no user context in worker)

**Adding new email type:**
1. Add constant to `OutboxMessageTypes` + payload record in `Application/Common/OutboxMessageTypes.cs`
2. Add `case` to `OutboxWorker.DispatchAsync`
3. Enqueue in handler via `outboxService.EnqueueAsync(OutboxMessageTypes.YourType, payload, ct)`

**Concurrency:** `SELECT FOR UPDATE SKIP LOCKED` in PostgreSQL transaction — multiple worker instances never process same message.

## Adding New Features

- **New Command**: add folder `Application/Commands/{Feature}/` — single file with `{Action}Command` (record), `{Action}Validator` (FluentValidation), `{Action}Handler` (implements `IHandler<TCommand, Result<TResponse>>`). No MediatR.
- **New Query**: add folder `Application/Queries/{Feature}/` — same single-file pattern; handler uses Dapper, not EF Core.
- **New Endpoint**: static class in `API/Endpoints/{Feature}/`, register via `EndpointExtensions`.
- **New Repository**: interface in `Domain/Interfaces/`, implementation in `Infrastructure/Persistence/Repositories/`, register in `ServiceExtensions`.
- **New Permission**: add constant to `Application/IAM/Constants/Resources.cs`, wire in `IamSeed`.
- **New Migration**: run from `src/Ims.YamiFlow.API` — `dotnet ef migrations add <Name> --project ../Ims.YamiFlow.Infrastructure`.

## Docker / Development

**Rider runs the API inside Docker using the build stage only** (`target: "build"` in `.idea/.idea.Ims.YamiFlow/Docker/docker-compose.generated.override.yml`). The runtime stage is for production. Any tool installed only in the runtime stage is NOT available during local Rider dev.

**Image names:**
- Rider builds and tags: `ims.yamiflow.api:dev`
- `docker compose -f docker-compose.dev.yml build` tags: `ims-yamiflow-api:latest` (different name — does NOT affect the Rider container)
- To rebuild the Rider image: stop the run config in Rider and restart it (Rider rebuilds automatically), or `docker build --target build -t ims.yamiflow.api:dev .`

**ffmpeg in Docker:**
- Build stage (SDK, Debian): installed via `apt-get install ffmpeg` → binary at `/usr/bin/ffmpeg`
- Runtime stage (Noble + mwader/static-ffmpeg): static binary copied to `/usr/bin/ffmpeg`
- Config: `appsettings.json` → `Ffmpeg.FfmpegPath = "/usr/bin/ffmpeg"`, `Ffmpeg.FfprobePath = "/usr/bin/ffprobe"`
- `mwader/static-ffmpeg` is musl-linked static binary; needs `musl` apt package on Ubuntu Noble to provide `/lib/ld-musl-aarch64.so.1`
- Video storage: `docker-compose.dev.yml` mounts `./video_data:/var/videos`; `Storage.RootPath = "/var/videos"` in appsettings

**EF Core new-entity pitfall:**
When adding entities to private backing collections on an aggregate root, EF Core may track them as `Modified` (not `Added`) during graph traversal. Always call `db.Set<T>().Add(entity)` explicitly via the repository — never rely on graph traversal to detect new entities with non-default Guid keys.

**DI registration:**
`AddApplicationServices` registers all `IHandler<,>` implementations as concrete types only — never `services.AddScoped<IHandler<TCmd,TResp>, THandler>()`. Endpoint lambdas must inject the concrete handler class, not the interface.
