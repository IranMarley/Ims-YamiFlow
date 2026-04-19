using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RequestAudit = Ims.YamiFlow.Domain.Entities.Audit;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class AuditConfiguration : IEntityTypeConfiguration<RequestAudit>
{
    public void Configure(EntityTypeBuilder<RequestAudit> builder)
    {
        builder.ToTable("Audits");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.UserId).HasColumnType("text").IsRequired(false);
        builder.Property(a => a.Method).HasMaxLength(16).IsRequired();
        builder.Property(a => a.Path).HasMaxLength(2048).IsRequired();
        builder.Property(a => a.QueryString).HasMaxLength(2048).IsRequired(false);
        builder.Property(a => a.RequestBody).HasColumnType("text").IsRequired(false);
        builder.Property(a => a.ResponseBody).HasColumnType("text").IsRequired(false);
        builder.Property(a => a.StatusCode).IsRequired();
        builder.Property(a => a.ElapsedMs).IsRequired();
        builder.Property(a => a.IpAddress).HasMaxLength(45).IsRequired(false);
        builder.Property(a => a.UserAgent).HasMaxLength(1024).IsRequired(false);
        builder.Property(a => a.CreatedAt).HasColumnType("timestamp with time zone").IsRequired();

        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.CreatedAt);
    }
}

