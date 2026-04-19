# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ims.YamiFlow** is a full-featured online course platform (LMS) built with Clean Architecture + CQRS on .NET 10. All code, comments, XML docs, and variable names must be in **English** — no Portuguese anywhere in code (only acceptable in user-facing message strings).

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
  Ims.YamiFlow.Domain.Tests
  Ims.YamiFlow.Application.Tests
  Ims.YamiFlow.Integration.Tests
```

**Dependency rule:** API → Application + Infrastructure → Domain → nothing.

| Responsibility | Technology |
|---|---|
| Framework | ASP.NET Core Minimal API (.NET 10) |
| CQRS | MediatR 12 |
| ORM (writes) | EF Core 10 + Npgsql |
| ORM (reads) | Dapper |
| Auth | ASP.NET Identity + JWT Bearer |
| Social Login | Google + Facebook OAuth2 |
| Validation | FluentValidation 11 |
| Logging | Serilog |
| Cache | Redis / IMemoryCache |
| Database | PostgreSQL |

## Key Patterns

**CQRS**: Commands and Queries each live in their own folder with all related files together (`Command`, `Handler`, `Validator` in one folder). Reads use Dapper; writes use EF Core repositories + UnitOfWork.

**Result pattern**: All handlers return `Result<T>` or `PagedResult<T>` — never throw for business failures.

**ValidationBehavior**: FluentValidation runs in the MediatR pipeline before every handler automatically.

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
- `IdentityRoleClaim` → Permission (type: `"permission"`, value: `"Course:Create"`)
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

## Domain Model

Entities and their key behaviors:

| Entity | Behavior methods |
|---|---|
| `Course` | `Publish()`, `Archive()`, `SetPromotion(price, expiresAt)` |
| `Enrollment` | `CompleteLesson(lessonId)`, `CalculateProgress(totalLessons)`, `IsEligibleForCertificate(totalLessons)` |
| `Coupon` | `IsValid()`, `Apply(price)` |
| `Review` | Rating (1–5) + comment; one per enrolled student per course |
| `ForumPost` | `AddReply(reply)` — supports nested replies |
| `Audit` | Change tracking (entity, action, userId, timestamp) |

Hierarchy: `Course` → `Module` → `Lesson`; `Enrollment` → `LessonProgress`, `Certificate`.

Enums: `CourseStatus`, `CourseLevel`, `EnrollmentStatus`, `LessonType`, `CouponType`, `PaymentStatus`, `NotificationType`, `SubscriptionStatus`.

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
  }
}
```

`appsettings.Development.json` uses `yamflow_dev` database, debug logging, and EF SQL logging.

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
| Lessons: Add, Update, Delete, Reorder, Complete, SaveProgress | Complete | |
| Enrollments: Enroll (with coupon), Cancel, GetMy, GetProgress | Complete | |
| Certificates: Issue, Verify | Complete | |
| Reviews: Create, Update, Delete, List | Complete | Requires enrollment; one per student per course |
| Forum: CreatePost, ReplyToPost, DeletePost, List, GetDetail | Complete | Delete restricted to owner or Admin |
| Coupons: Create, Delete, Validate, List | Complete | FixedAmount + Percentage types |
| Course Promotion: SetPromotion | Complete | Time-limited promotional price |
| Admin Dashboard: Stats, ListUsers, ToggleUserStatus, UpdateUser | Complete | |
| Instructor Dashboard: MyCourses, Stats, Revenue, Students | Complete | |
| Audit trail | Complete | Migration `AddAuditTable` (2026-04-16); Audit.NET EF integration via `PostgresAuditDataProvider` |
| Dapper read queries | Complete | All queries use Dapper, not EF Core |
| Email service | Stub (`NoOpEmailService`) | Replace with real SMTP/SendGrid impl |
| Payments: InitiatePayment | Stub | Returns mock response — needs Stripe/PayPal |
| Subscriptions: Checkout, Cancel, Webhook | Complete | Stripe recurring billing (monthly + annual); see below |
| Quizzes: Create, AddQuestion, Submit, Delete, Get | Stub | Models + validators done; handlers don't persist |
| Notifications: MarkRead, MarkAllRead, List | Stub | Handlers return success without DB ops |
| Affiliates: CreateLink, GetStats | Stub | Generates code but doesn't persist |
| Video / Storage services | Not started | Folder scaffold only |

## Database Migrations

Three migrations applied (project in `Infrastructure`):

| Migration | Date | Content |
|---|---|---|
| `InitialCreate` | 2026-04-11 | Core schema: users, courses, modules, lessons, enrollments, certificates, coupons |
| `AddReviewsForumPromotion` | 2026-04-13 | Reviews, ForumPosts, Course promotional price fields |
| `AddAuditTable` | 2026-04-16 | Audit change-tracking table |
| `AddSubscriptionAndIsFree` | 2026-04-17 | `Subscriptions` table; `Course.IsFree` column |

## Audit.NET Integration

Audit.NET EF (v25.x) populates `entry.Name` using `IEntityType.DisplayName()` — this returns the CLR type name (e.g. `AppUser`, `IdentityUserRole<string>`), **not** the database table name.

**Resolution:** `PostgresAuditDataProvider.BuildTableNameMap` builds a dictionary `DisplayName() → GetTableName()` from `AppDbContext.Model.GetEntityTypes()` and maps the name before every insert/update.

**Do not** try to fix this in `AppDbContext.OnScopeSaving` — Audit.NET repopulates the entries after that hook runs, overwriting any changes.

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

**Access rule:** a user can access a course if `Course.IsFree == true` OR they have an active/trialing subscription.

**Stripe integration** (Stripe.net v51):
- `POST /api/subscriptions/checkout` — creates a Stripe Checkout Session and returns `{ checkoutUrl }`
- `POST /api/subscriptions/cancel` — cancels at period end via `CancelAtPeriodEnd`
- `GET /api/subscriptions/current` — returns current `Subscription` row or `null`
- `POST /api/webhooks/stripe` — handles `customer.subscription.created/updated/deleted` and `invoice.payment_failed`

**Stripe.net v51 breaking changes to remember:**
- `Subscription.CurrentPeriodEnd` was moved to `SubscriptionItem` — access via `sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd`
- `Invoice.SubscriptionId` removed — use `invoice.Parent?.SubscriptionDetails?.SubscriptionId`

**`appsettings.json` Stripe keys:**
```json
{
  "Stripe": {
    "SecretKey": "sk_...",
    "WebhookSecret": "whsec_...",
    "PlanMonthlyId": "price_...",
    "PlanAnnualId": "price_..."
  }
}
```

**`SubscriptionStatus` enum:** `Active`, `Cancelled`, `Expired`, `Trialing`, `PastDue`

**`ICourseAccessService.CanAccessAsync(userId, courseId)`** — checks `Course.IsFree` OR active subscription in a single Dapper query.

## Frontend (web/)

Located at `/web/` — Next.js 16 App Router with TypeScript, TanStack Query v5, Zustand, Axios.

```
web/src/
  app/                     → Next.js App Router (route files only — page.tsx wrappers)
    layout.tsx             → Root layout + Providers
    providers.tsx          → QueryClientProvider + Toaster
    page.tsx               → /  (LandingPage)
    login/page.tsx         → /login
    register/page.tsx      → /register
    forgot-password/       → /forgot-password
    reset-password/        → /reset-password
    courses/               → /courses (public)
      [id]/                → /courses/:id (public)
        reviews/           → /courses/:id/reviews
    (protected)/           → Auth-guarded layout
      layout.tsx           → ProtectedRoute wrapper
      dashboard/           → /dashboard
      enrollments/         → /enrollments
      subscriptions/       → /subscriptions
      subscription/
        success/           → /subscription/success  (post-Stripe redirect)
        cancelled/         → /subscription/cancelled
      courses/[id]/learn/  → /courses/:id/learn
      account/             → /account
      admin/               → /admin
      instructor/          → /instructor
        courses/[id]/      → /instructor/courses/:id
      forum/               → /forum
        [id]/              → /forum/:id
      notifications/       → /notifications
      payments/            → /payments
      coupons/             → /coupons
      quizzes/             → /quizzes
      affiliates/          → /affiliates
      auth/change-password/
  pages/                   → Actual page component implementations
  hooks/
    useSubscription.ts     → useSubscription, useCreateCheckout, useCancelSubscription
  services/
    subscription.service.ts
  types/
    subscription.ts        → SubscriptionStatus, Subscription, CheckoutSessionResponse
```

**Navigation:** use `useRouter`, `useParams`, `useSearchParams` from `next/navigation`; `Link` from `next/link`. No `react-router-dom`.

**Subscription env vars (frontend):**
```
NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID=price_...
NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID=price_...
```

**Course access in UI:** `course.isFree || hasActiveSubscription` → enroll/start learning; otherwise → redirect to `/subscriptions`.

## Adding New Features

- **New Command**: add folder `Application/Commands/{Feature}/{ActionName}/` containing `{Action}Command.cs`, `{Action}Handler.cs`, `{Action}Validator.cs`.
- **New Query**: add folder `Application/Queries/{Feature}/` — use Dapper in the handler, not EF Core.
- **New Endpoint**: static class in `API/Endpoints/{Feature}/`, register via `EndpointExtensions`.
- **New Repository**: interface in `Domain/Interfaces/`, implementation in `Infrastructure/Persistence/Repositories/`, register in `ServiceExtensions`.
- **New Permission**: add constant to `Application/IAM/Constants/Resources.cs`, wire in `IamSeed`.
