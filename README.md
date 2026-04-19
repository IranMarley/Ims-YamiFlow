# Ims.YamiFlow

Ims.YamiFlow is a full-featured online course platform (LMS) implemented with Clean Architecture and CQRS on .NET 10.

This README is an English summary of the repository. For detailed engineering notes and internal guidance see `CLAUDE.md`.

---

## Quickstart

Prerequisites:
- .NET 10 SDK
- PostgreSQL
- (Optional) Redis for caching

Basic commands:

Restore packages, build, and run tests:

```bash
# Restore
dotnet restore

# Build
dotnet build Ims.YamiFlow.sln

# Run tests (solution or single project)
dotnet test Ims.YamiFlow.sln
# or
# dotnet test tests/Ims.YamiFlow.Domain.Tests
# dotnet test tests/Ims.YamiFlow.Application.Tests
# dotnet test tests/Ims.YamiFlow.Integration.Tests
```

EF Core migrations (run from `src/Ims.YamiFlow.API`):

```bash
# Add migration (example)
dotnet ef migrations add <MigrationName> --project ../Ims.YamiFlow.Infrastructure
# Apply migrations to DB
dotnet ef database update
```

Run the API:

```bash
dotnet run --project src/Ims.YamiFlow.API
```

Swagger: `https://localhost:{port}/swagger`
Health check: `GET /health`

---

## Project structure

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
web-client/ (frontend)
```

Dependency direction: API → Application + Infrastructure → Domain → (no dependencies)

---

## Technology stack

| Responsibility | Technology |
|---|---|
| Framework | ASP.NET Core Minimal API (.NET 10) |
| CQRS | MediatR |
| ORM (writes) | EF Core + Npgsql |
| ORM (reads) | Dapper |
| Auth | ASP.NET Identity + JWT Bearer |
| Social Login | Google + Facebook OAuth2 |
| Validation | FluentValidation |
| Logging | Serilog |
| Cache | Redis / IMemoryCache |
| Database | PostgreSQL |

---

## Key architecture & patterns

- CQRS: commands and queries keep related types together in a feature folder (Command, Handler, Validator).
- Writes use EF Core repositories + UnitOfWork; reads use Dapper for fast SQL queries.
- Handlers return `Result<T>` or `PagedResult<T>` — business failures are modeled, not thrown.
- `ValidationBehavior` executes FluentValidation in the MediatR pipeline before handlers.
- Endpoints are single-file static classes with a `Map` method and are registered via `EndpointExtensions`.

Example endpoint structure:

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

---

## IAM & Authorization

- Uses ASP.NET Identity with roles (Admin, Instructor, Student) and role claims to represent permissions.
- Permissions are stored as claims using the pattern: ClaimType = Resource (e.g. `Course`), ClaimValue = Operation (e.g. `Create`).
- JWTs include resource-specific claims (for example, `"Course": ["Create","Read"]`).
- Always secure endpoints with inline claim checks, e.g.:

```csharp
app.MapPost("/api/courses", handler)
   .RequireAuthorization(x => x.RequireClaim("Course", "Create"));
```

Default roles are seeded at startup by `IamSeed`.

---

## Authentication endpoints (summary)

- `POST /api/auth/register` — register and assign Student role; send confirmation email
- `POST /api/auth/login` — email + password → JWT + refresh token
- `POST /api/auth/logout` — invalidate refresh token
- `POST /api/auth/refresh-token` — exchange refresh token for new JWT
- `POST /api/auth/forgot-password` — send reset email
- `POST /api/auth/reset-password` — reset using token
- `POST /api/auth/change-password` — authenticated password change
- `POST /api/auth/confirm-email` — confirm email with token
- `GET /api/auth/external-login/{provider}` and `/external-login-callback` — Google/Facebook OAuth2

Social login behavior: if the provider email matches an existing account, accounts are linked; otherwise a new Student user is created (email confirmed by default).

---

## Domain model (high level)

Core entities and important behaviors include:

- Course (Publish, Archive, SetPromotion)
- Module, Lesson (hierarchy: Course → Module → Lesson)
- Enrollment (CompleteLesson, CalculateProgress, IsEligibleForCertificate)
- Coupon (IsValid, Apply)
- Review (one per enrolled student per course; Rating 1–5)
- ForumPost (supports nested replies)
- Audit (change tracking)

Domain entities expose methods for mutations; setters are private and business rules live inside entities.

---

## Subscriptions & Payments

- The product uses a subscription (Netflix-style) model: users access content if the course is free (`Course.IsFree`) or they have an active subscription.
- Stripe is used for subscriptions and webhooks (see `Subscriptions` endpoints and `POST /api/webhooks/stripe`).
- Relevant `appsettings.json` keys: `Stripe.SecretKey`, `Stripe.WebhookSecret`, `Stripe.PlanMonthlyId`, `Stripe.PlanAnnualId`.

---

## Configuration

Important configuration keys (in `appsettings.json` / `appsettings.Development.json`):

- Connection strings: `ConnectionStrings:DefaultConnection`, `ConnectionStrings:Redis`
- JWT: `JwtSettings:Secret` (>= 32 chars), `Issuer`, `Audience`, `ExpirationHours`, `RefreshTokenExpirationDays`
- Authentication: Google/Facebook client IDs and secrets
- Email: SMTP settings

Development `appsettings.Development.json` uses `yamflow_dev` database and enables EF logging.

---

## Frontend

The frontend lives in `web-client/` and is a Next.js (App Router) TypeScript application using TanStack Query, Zustand and Axios.

- Frontend env vars: `NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID`, `NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID`
- Course access logic in the UI: `course.isFree || hasActiveSubscription`

---

## Adding new features (developer notes)

- New Command: create `Application/Commands/{Feature}/{Action}/` with `{Action}Command.cs`, `{Action}Handler.cs`, `{Action}Validator.cs`.
- New Query: add `Application/Queries/{Feature}/` and use Dapper in handler for read queries.
- New Endpoint: add static class under `API/Endpoints/{Feature}/` and register it in `EndpointExtensions`.
- New Repository: add interface in `Domain/Interfaces/` and implementation in `Infrastructure/Persistence/Repositories/`; register in `ServiceExtensions`.
- New Permission: add to `Application/IAM/Constants/Resources.cs` and wire it in `IamSeed`.

---

## What is implemented (summary)

Major implemented areas include domain entities and behaviors, ASP.NET Identity + JWT + refresh tokens, full auth flows, IAM (roles/permissions), course/module/lesson CRUD and workflows, enrollments, certificates, reviews, forum features, and various dashboards. Several services are stubbed (Email, Payments, Quizzes, Notifications, Affiliates) and require production implementations.

See `CLAUDE.md` for a full status table and implementation notes.

---

## Development & contributing

- Follow existing code conventions: English-only identifiers and XML docs, Clean Architecture layering, MediatR patterns.
- Run tests frequently: `dotnet test` per project.
- Add migrations from `src/Ims.YamiFlow.API` targeting the `Ims.YamiFlow.Infrastructure` project.
- Keep `CLAUDE.md` as the source of internal engineering notes.

If you'd like to contribute, open an issue or a PR describing the feature or fix.

---

## License & contact

This repository does not include a license file by default. Add a `LICENSE` if you want to make the project open source.

For questions about the codebase, see the maintainers or open an issue.
