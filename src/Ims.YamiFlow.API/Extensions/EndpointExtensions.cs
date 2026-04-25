using Ims.YamiFlow.API.Endpoints;
using Ims.YamiFlow.API.Endpoints.IAM;
using Ims.YamiFlow.API.Filters;

namespace Ims.YamiFlow.API.Extensions;

public static class EndpointExtensions
{
    public static void MapAllEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("").AddEndpointFilter<ValidationFilter>();

        // ── Auth ──────────────────────────────────────
        AuthEndpoints.Map(api);

        // ── IAM ───────────────────────────────────────
        RoleEndpoints.Map(api);
        PermissionEndpoints.Map(api);
        UserEndpoints.Map(api);

        // ── Courses ───────────────────────────────────
        CourseEndpoints.Map(api);

        // ── Modules ───────────────────────────────────
        ModuleEndpoints.Map(api);

        // ── Lessons ───────────────────────────────────
        LessonEndpoints.Map(api);

        // ── Enrollments ───────────────────────────────
        EnrollmentEndpoints.Map(api);

        // ── Certificates ──────────────────────────────
        CertificateEndpoints.Map(api);

        // ── Reviews ───────────────────────────────────
        ReviewEndpoints.Map(api);

        // ── Quizzes ───────────────────────────────────
        QuizEndpoints.Map(api);

        // ── Coupons ───────────────────────────────────
        CouponEndpoints.Map(api);

        // ── Notifications ─────────────────────────────
        NotificationEndpoints.Map(api);

        // ── Payments ──────────────────────────────────
        PaymentEndpoints.Map(api);

        // ── Admin ─────────────────────────────────────
        AdminEndpoints.Map(api);

        // ── Forum ─────────────────────────────────────
        ForumEndpoints.Map(api);

        // ── Instructor ────────────────────────────────
        InstructorEndpoints.Map(api);

        // ── Subscriptions ─────────────────────────────
        SubscriptionEndpoints.Map(api);

        // ── Affiliates ────────────────────────────────
        AffiliateEndpoints.Map(api);

        // ── Videos ────────────────────────────────────
        VideoEndpoints.Map(api);

        // ── Stripe Webhook ────────────────────────────
        StripeWebhookEndpoint.Map(api);
    }
}
