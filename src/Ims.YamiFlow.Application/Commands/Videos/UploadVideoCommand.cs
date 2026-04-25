using FluentValidation;
using Ims.YamiFlow.Application.Common;
using Ims.YamiFlow.Domain.Entities;

using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Ims.YamiFlow.Domain.Interfaces.Services;

namespace Ims.YamiFlow.Application.Commands.Videos;

// ── Command ───────────────────────────────────────────
public record UploadVideoCommand(
    Guid CourseId,
    Guid LessonId,
    string InstructorId,
    Stream FileStream,
    string FileName,
    long FileSizeBytes
);

// ── Response ──────────────────────────────────────────
public record UploadVideoResponse(Guid JobId, string Status);

// ── Validator ─────────────────────────────────────────
public class UploadVideoValidator : AbstractValidator<UploadVideoCommand>
{
    private static readonly string[] AllowedExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
    private const long MaxBytes = 4L * 1024 * 1024 * 1024; // 4 GB

    public UploadVideoValidator()
    {
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.LessonId).NotEmpty();
        RuleFor(x => x.InstructorId).NotEmpty();

        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0).WithMessage("File is empty.")
            .LessThanOrEqualTo(MaxBytes).WithMessage("File exceeds the 4 GB limit.");

        RuleFor(x => x.FileName)
            .Must(name => AllowedExtensions.Contains(
                Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("Unsupported video format. Allowed: .mp4 .mov .avi .mkv .webm");
    }
}

// ── Handler ───────────────────────────────────────────
public class UploadVideoHandler(
    ICourseRepository courses,
    IVideoProcessingJobRepository jobs,
    IStorageService storage,
    IUnitOfWork uow)
    : IHandler<UploadVideoCommand, Result<UploadVideoResponse>>
{
    public async Task<Result<UploadVideoResponse>> Handle(UploadVideoCommand cmd, CancellationToken ct)
    {
        var course = await courses.GetByIdWithModulesAsync(cmd.CourseId, ct);
        if (course is null)
            return Result.Failure<UploadVideoResponse>("Course not found.");

        if (course.InstructorId != cmd.InstructorId)
            return Result.Failure<UploadVideoResponse>("Access denied.");

        // Verify lesson belongs to this course
        var lesson = course.Modules
            .SelectMany(m => m.Lessons)
            .FirstOrDefault(l => l.Id == cmd.LessonId);

        if (lesson is null)
            return Result.Failure<UploadVideoResponse>("Lesson not found in this course.");

        var ext = Path.GetExtension(cmd.FileName).ToLowerInvariant();
        var relativePath = $"videos/{cmd.CourseId}/{cmd.LessonId}/raw/original{ext}";

        await storage.UploadAsync(cmd.FileStream, relativePath, "video/mp4", ct);

        var job = VideoProcessingJob.Create(cmd.LessonId, cmd.CourseId, relativePath);
        await jobs.AddAsync(job, ct);
        await uow.CommitAsync(ct);

        return Result.Success(new UploadVideoResponse(job.Id, job.Status));
    }
}
