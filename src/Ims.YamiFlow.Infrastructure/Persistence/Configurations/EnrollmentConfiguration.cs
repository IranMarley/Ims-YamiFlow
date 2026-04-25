using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.StudentId).IsRequired();
        builder.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique();

        builder.HasMany(e => e.Progress)
               .WithOne()
               .HasForeignKey(p => p.EnrollmentId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
