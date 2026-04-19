using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Title).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Slug).IsRequired().HasMaxLength(200);
        builder.HasIndex(c => c.Slug).IsUnique();
        builder.Property(c => c.Description).HasMaxLength(2000);
        builder.Property(c => c.Price).HasPrecision(10, 2);
        builder.Property(c => c.PromotionalPrice).HasPrecision(10, 2);
        builder.Property(c => c.InstructorId).IsRequired();

        builder.HasMany(c => c.Modules)
               .WithOne()
               .HasForeignKey(m => m.CourseId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ModuleConfiguration : IEntityTypeConfiguration<Module>
{
    public void Configure(EntityTypeBuilder<Module> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Title).IsRequired().HasMaxLength(200);

        builder.HasMany(m => m.Lessons)
               .WithOne()
               .HasForeignKey(l => l.ModuleId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Title).IsRequired().HasMaxLength(200);
        builder.Property(l => l.ContentUrl).HasMaxLength(500);
    }
}

public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.StudentId).IsRequired();
        builder.Property(e => e.PricePaid).HasPrecision(10, 2);

        builder.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique();

        builder.HasMany(e => e.Progress)
               .WithOne()
               .HasForeignKey(p => p.EnrollmentId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LessonProgressConfiguration : IEntityTypeConfiguration<LessonProgress>
{
    public void Configure(EntityTypeBuilder<LessonProgress> builder)
    {
        builder.HasKey(p => new { p.EnrollmentId, p.LessonId });
    }
}

public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Code).IsRequired().HasMaxLength(20);
        builder.HasIndex(c => c.Code).IsUnique();
        builder.HasIndex(c => c.EnrollmentId).IsUnique();
    }
}

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Code).IsRequired().HasMaxLength(50);
        builder.HasIndex(c => c.Code).IsUnique();
        builder.Property(c => c.Value).HasPrecision(10, 2);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.StudentId).IsRequired();
        builder.Property(r => r.Comment).IsRequired().HasMaxLength(2000);
        builder.HasIndex(r => new { r.StudentId, r.CourseId }).IsUnique();
    }
}

public class ForumPostConfiguration : IEntityTypeConfiguration<ForumPost>
{
    public void Configure(EntityTypeBuilder<ForumPost> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.AuthorId).IsRequired();
        builder.Property(p => p.Title).IsRequired().HasMaxLength(300);
        builder.Property(p => p.Body).IsRequired().HasMaxLength(10000);

        builder.HasMany(p => p.Replies)
               .WithOne()
               .HasForeignKey(r => r.PostId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ForumReplyConfiguration : IEntityTypeConfiguration<ForumReply>
{
    public void Configure(EntityTypeBuilder<ForumReply> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.AuthorId).IsRequired();
        builder.Property(r => r.Body).IsRequired().HasMaxLength(10000);
    }
}
