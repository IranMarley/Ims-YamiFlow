using FluentValidation;
using Ims.YamiFlow.Domain.Entities;

using Ims.YamiFlow.Domain.Interfaces.Repositories;

namespace Ims.YamiFlow.Application.Commands.Reviews;

// ── Responses ─────────────────────────────────────────
public record ReviewResponse(
    Guid ReviewId,
    Guid CourseId,
    string StudentId,
    int Rating,
    string Comment,
    DateTime CreatedAt
);

// ── CreateReviewCommand ───────────────────────────────
public record CreateReviewCommand(
    Guid CourseId,
    string StudentId,
    int Rating,
    string Comment
);

public class CreateReviewValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).NotEmpty().MaximumLength(2000);
    }
}

public class CreateReviewHandler(
    IReviewRepository reviewRepository,
    IEnrollmentRepository enrollmentRepository,
    IUnitOfWork uow)
    : IHandler<CreateReviewCommand, Result<ReviewResponse>>
{
    public async Task<Result<ReviewResponse>> Handle(CreateReviewCommand cmd, CancellationToken ct)
    {
        // Must be enrolled to review
        var enrolled = await enrollmentRepository.ExistsAsync(cmd.StudentId, cmd.CourseId, ct);
        if (!enrolled)
            return Result.Failure<ReviewResponse>("You must be enrolled in this course to leave a review.");

        // One review per student per course
        var existing = await reviewRepository.GetByStudentAndCourseAsync(cmd.StudentId, cmd.CourseId, ct);
        if (existing is not null)
            return Result.Failure<ReviewResponse>("You have already reviewed this course.");

        var review = Review.Create(cmd.CourseId, cmd.StudentId, cmd.Rating, cmd.Comment);
        await reviewRepository.AddAsync(review, ct);
        await uow.CommitAsync(ct);

        return Result.Success(new ReviewResponse(
            review.Id, review.CourseId, review.StudentId,
            review.Rating, review.Comment, review.CreatedAt));
    }
}

// ── UpdateReviewCommand ───────────────────────────────
public record UpdateReviewCommand(
    Guid ReviewId,
    string StudentId,
    int Rating,
    string Comment
);

public class UpdateReviewValidator : AbstractValidator<UpdateReviewCommand>
{
    public UpdateReviewValidator()
    {
        RuleFor(x => x.ReviewId).NotEmpty();
        RuleFor(x => x.StudentId).NotEmpty();
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Comment).NotEmpty().MaximumLength(2000);
    }
}

public class UpdateReviewHandler(IReviewRepository reviewRepository, IUnitOfWork uow)
    : IHandler<UpdateReviewCommand, Result>
{
    public async Task<Result> Handle(UpdateReviewCommand cmd, CancellationToken ct)
    {
        var review = await reviewRepository.GetByIdAsync(cmd.ReviewId, ct);
        if (review is null)
            return Result.Failure("Review not found.");
        if (review.StudentId != cmd.StudentId)
            return Result.Failure("You can only edit your own reviews.");

        review.Update(cmd.Rating, cmd.Comment);
        reviewRepository.Update(review);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}

// ── DeleteReviewCommand ───────────────────────────────
public record DeleteReviewCommand(Guid ReviewId, string StudentId);

public class DeleteReviewValidator : AbstractValidator<DeleteReviewCommand>
{
    public DeleteReviewValidator()
    {
        RuleFor(x => x.ReviewId).NotEmpty();
        RuleFor(x => x.StudentId).NotEmpty();
    }
}

public class DeleteReviewHandler(IReviewRepository reviewRepository, IUnitOfWork uow)
    : IHandler<DeleteReviewCommand, Result>
{
    public async Task<Result> Handle(DeleteReviewCommand cmd, CancellationToken ct)
    {
        var review = await reviewRepository.GetByIdAsync(cmd.ReviewId, ct);
        if (review is null)
            return Result.Failure("Review not found.");
        if (review.StudentId != cmd.StudentId)
            return Result.Failure("You can only delete your own reviews.");

        reviewRepository.Remove(review);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}
