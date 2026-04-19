using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.Infrastructure.Persistence.Repositories;

public class CourseRepository(AppDbContext db) : ICourseRepository
{
    public async Task<Course?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Courses.FindAsync([id], ct);

    public async Task<Course?> GetByIdWithModulesAsync(Guid id, CancellationToken ct = default)
        => await db.Courses
            .Include(c => c.Modules)
            .ThenInclude(m => m.Lessons)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(Course course, CancellationToken ct = default)
        => await db.Courses.AddAsync(course, ct);

    public void Update(Course course)
        => db.Courses.Update(course);

    public void RemoveModule(Module module)
        => db.Modules.Remove(module);

    public void RemoveLesson(Lesson lesson)
        => db.Lessons.Remove(lesson);
}

public class EnrollmentRepository(AppDbContext db) : IEnrollmentRepository
{
    public async Task<Enrollment?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Enrollments
            .Include(e => e.Progress)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<Enrollment?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default)
        => await db.Enrollments
            .Include(e => e.Progress)
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId, ct);

    public async Task<bool> ExistsAsync(string studentId, Guid courseId, CancellationToken ct = default)
        => await db.Enrollments.AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId, ct);

    public async Task AddAsync(Enrollment enrollment, CancellationToken ct = default)
        => await db.Enrollments.AddAsync(enrollment, ct);

    public void Update(Enrollment enrollment)
        => db.Enrollments.Update(enrollment);
}

public class CertificateRepository(AppDbContext db) : ICertificateRepository
{
    public async Task<Certificate?> GetByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default)
        => await db.Certificates.FirstOrDefaultAsync(c => c.EnrollmentId == enrollmentId, ct);

    public async Task<Certificate?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await db.Certificates.FirstOrDefaultAsync(c => c.Code == code, ct);

    public async Task AddAsync(Certificate certificate, CancellationToken ct = default)
        => await db.Certificates.AddAsync(certificate, ct);
}

public class CouponRepository(AppDbContext db) : ICouponRepository
{
    public async Task<Coupon?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Coupons.FindAsync([id], ct);

    public async Task<Coupon?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await db.Coupons.FirstOrDefaultAsync(c => c.Code == code.ToUpper(), ct);

    public async Task AddAsync(Coupon coupon, CancellationToken ct = default)
        => await db.Coupons.AddAsync(coupon, ct);

    public void Update(Coupon coupon)
        => db.Coupons.Update(coupon);

    public void Remove(Coupon coupon)
        => db.Coupons.Remove(coupon);
}

public class ReviewRepository(AppDbContext db) : IReviewRepository
{
    public async Task<Review?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Reviews.FindAsync([id], ct);

    public async Task<Review?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default)
        => await db.Reviews.FirstOrDefaultAsync(r => r.StudentId == studentId && r.CourseId == courseId, ct);

    public async Task AddAsync(Review review, CancellationToken ct = default)
        => await db.Reviews.AddAsync(review, ct);

    public void Update(Review review)
        => db.Reviews.Update(review);

    public void Remove(Review review)
        => db.Reviews.Remove(review);
}

public class ForumPostRepository(AppDbContext db) : IForumPostRepository
{
    public async Task<ForumPost?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.ForumPosts
            .Include(p => p.Replies)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(ForumPost post, CancellationToken ct = default)
        => await db.ForumPosts.AddAsync(post, ct);

    public void Remove(ForumPost post)
        => db.ForumPosts.Remove(post);
}

public class SubscriptionPlanRepository(AppDbContext db) : ISubscriptionPlanRepository
{
    public Task<SubscriptionPlan?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == id, ct);

    public Task<SubscriptionPlan?> GetByStripePriceIdAsync(string stripePriceId, CancellationToken ct = default)
        => db.SubscriptionPlans.FirstOrDefaultAsync(p => p.StripePriceId == stripePriceId, ct);

    public async Task<IReadOnlyList<SubscriptionPlan>> ListActiveAsync(CancellationToken ct = default)
        => await db.SubscriptionPlans
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Amount)
            .ToListAsync(ct);

    public async Task AddAsync(SubscriptionPlan plan, CancellationToken ct = default)
        => await db.SubscriptionPlans.AddAsync(plan, ct);

    public void Update(SubscriptionPlan plan) => db.SubscriptionPlans.Update(plan);
}

public class SubscriptionRepository(AppDbContext db) : ISubscriptionRepository
{
    public Task<Subscription?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Subscriptions.FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<Subscription?> GetByStripeSubscriptionIdAsync(string stripeSubscriptionId, CancellationToken ct = default)
        => db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId, ct);

    public Task<Subscription?> GetActiveByUserAsync(string userId, CancellationToken ct = default)
        => db.Subscriptions
            .Where(s => s.UserId == userId &&
                        (s.Status == Domain.Enums.SubscriptionStatus.Active ||
                         s.Status == Domain.Enums.SubscriptionStatus.Trialing ||
                         s.Status == Domain.Enums.SubscriptionStatus.PastDue))
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public Task<Subscription?> GetLatestByUserAsync(string userId, CancellationToken ct = default)
        => db.Subscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(Subscription subscription, CancellationToken ct = default)
        => await db.Subscriptions.AddAsync(subscription, ct);

    public void Update(Subscription subscription) => db.Subscriptions.Update(subscription);
}

public class PaymentRepository(AppDbContext db) : IPaymentRepository
{
    public Task<Payment?> GetByStripeInvoiceIdAsync(string stripeInvoiceId, CancellationToken ct = default)
        => db.Payments.FirstOrDefaultAsync(p => p.StripeInvoiceId == stripeInvoiceId, ct);

    public async Task AddAsync(Payment payment, CancellationToken ct = default)
        => await db.Payments.AddAsync(payment, ct);

    public void Update(Payment payment) => db.Payments.Update(payment);
}

public class StripeWebhookEventRepository(AppDbContext db) : IStripeWebhookEventRepository
{
    public Task<bool> ExistsAsync(string stripeEventId, CancellationToken ct = default)
        => db.StripeWebhookEvents.AnyAsync(e => e.Id == stripeEventId, ct);

    public async Task AddAsync(StripeWebhookEvent evt, CancellationToken ct = default)
        => await db.StripeWebhookEvents.AddAsync(evt, ct);

    public void Update(StripeWebhookEvent evt) => db.StripeWebhookEvents.Update(evt);
}

public class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    public async Task<int> CommitAsync(CancellationToken ct = default)
        => await db.SaveChangesAsync(ct);
}
