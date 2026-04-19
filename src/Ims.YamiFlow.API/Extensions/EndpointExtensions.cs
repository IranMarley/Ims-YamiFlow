using Ims.YamiFlow.API.Endpoints;
using Ims.YamiFlow.API.Endpoints.IAM;

namespace Ims.YamiFlow.API.Extensions;

public static class EndpointExtensions
{
    public static void MapAllEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Auth ──────────────────────────────────────
        AuthEndpoints.Map(app);

        // ── IAM ───────────────────────────────────────
        RoleEndpoints.Map(app);
        PermissionEndpoints.Map(app);
        UserEndpoints.Map(app);

        // ── Courses ───────────────────────────────────
        CourseEndpoints.Map(app);

        // ── Modules ───────────────────────────────────
        ModuleEndpoints.Map(app);

        // ── Lessons ───────────────────────────────────
        LessonEndpoints.Map(app);

        // ── Enrollments ───────────────────────────────
        EnrollmentEndpoints.Map(app);

        // ── Certificates ──────────────────────────────
        CertificateEndpoints.Map(app);

        // ── Reviews ───────────────────────────────────
        ReviewEndpoints.Map(app);

        // ── Quizzes ───────────────────────────────────
        QuizEndpoints.Map(app);

        // ── Coupons ───────────────────────────────────
        CouponEndpoints.Map(app);

        // ── Notifications ─────────────────────────────
        NotificationEndpoints.Map(app);

        // ── Payments ──────────────────────────────────
        PaymentEndpoints.Map(app);

        // ── Admin ─────────────────────────────────────
        AdminEndpoints.Map(app);

        // ── Forum ─────────────────────────────────────
        ForumEndpoints.Map(app);

        // ── Instructor ────────────────────────────────
        InstructorEndpoints.Map(app);

        // ── Subscriptions ─────────────────────────────
        SubscriptionEndpoints.Map(app);

        // ── Affiliates ────────────────────────────────
        AffiliateEndpoints.Map(app);

        // ── Stripe Webhook ────────────────────────────
        StripeWebhookEndpoint.Map(app);
    }
}
