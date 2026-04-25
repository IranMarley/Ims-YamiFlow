using Ims.YamiFlow.Domain.Entities;

namespace Ims.YamiFlow.Domain.Interfaces;

public interface ICourseRepository
{
    Task<Course?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Course?> GetByIdWithModulesAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Course course, CancellationToken ct = default);
    void Update(Course course);
    void RemoveModule(Module module);
    void RemoveLesson(Lesson lesson);
}

public interface IEnrollmentRepository
{
    Task<Enrollment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Enrollment?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default);
    Task<bool> ExistsAsync(string studentId, Guid courseId, CancellationToken ct = default);
    Task AddAsync(Enrollment enrollment, CancellationToken ct = default);
    void Update(Enrollment enrollment);
}

public interface ICertificateRepository
{
    Task<Certificate?> GetByEnrollmentIdAsync(Guid enrollmentId, CancellationToken ct = default);
    Task<Certificate?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task AddAsync(Certificate certificate, CancellationToken ct = default);
}

public interface ICouponRepository
{
    Task<Coupon?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Coupon?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task AddAsync(Coupon coupon, CancellationToken ct = default);
    void Update(Coupon coupon);
    void Remove(Coupon coupon);
}

public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Review?> GetByStudentAndCourseAsync(string studentId, Guid courseId, CancellationToken ct = default);
    Task AddAsync(Review review, CancellationToken ct = default);
    void Update(Review review);
    void Remove(Review review);
}

public interface IForumPostRepository
{
    Task<ForumPost?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ForumPost post, CancellationToken ct = default);
    void Remove(ForumPost post);
}

public interface ISubscriptionPlanRepository
{
    Task<SubscriptionPlan?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<SubscriptionPlan?> GetByStripePriceIdAsync(string stripePriceId, CancellationToken ct = default);
    Task<IReadOnlyList<SubscriptionPlan>> ListActiveAsync(CancellationToken ct = default);
    Task AddAsync(SubscriptionPlan plan, CancellationToken ct = default);
    void Update(SubscriptionPlan plan);
}

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Subscription?> GetByStripeSubscriptionIdAsync(string stripeSubscriptionId, CancellationToken ct = default);
    Task<Subscription?> GetActiveByUserAsync(string userId, CancellationToken ct = default);
    Task<Subscription?> GetLatestByUserAsync(string userId, CancellationToken ct = default);
    Task AddAsync(Subscription subscription, CancellationToken ct = default);
    void Update(Subscription subscription);
}

public interface IPaymentRepository
{
    Task<Payment?> GetByStripeInvoiceIdAsync(string stripeInvoiceId, CancellationToken ct = default);
    Task AddAsync(Payment payment, CancellationToken ct = default);
    void Update(Payment payment);
}

public interface IStripeWebhookEventRepository
{
    Task<bool> ExistsAsync(string stripeEventId, CancellationToken ct = default);
    Task AddAsync(StripeWebhookEvent evt, CancellationToken ct = default);
    void Update(StripeWebhookEvent evt);
}

public interface IUnitOfWork
{
    Task<int> CommitAsync(CancellationToken ct = default);
}

public interface IVideoProcessingJobRepository
{
    Task<VideoProcessingJob?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(VideoProcessingJob job, CancellationToken ct = default);
    void Update(VideoProcessingJob job);
}

public interface IVideoAssetRepository
{
    Task<VideoAsset?> GetByLessonIdAsync(Guid lessonId, CancellationToken ct = default);
    Task AddAsync(VideoAsset asset, CancellationToken ct = default);
    void Update(VideoAsset asset);
}
