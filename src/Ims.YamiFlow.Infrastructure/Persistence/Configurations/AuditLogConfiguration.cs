using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs", "audit");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).UseIdentityByDefaultColumn();

        builder.Property(a => a.Source).HasMaxLength(100).IsRequired().HasDefaultValue("API");
        builder.Property(a => a.EntityName).HasMaxLength(100);
        builder.Property(a => a.Action).HasMaxLength(50);
        builder.Property(a => a.UserId).HasMaxLength(100);
        builder.Property(a => a.UserName).HasMaxLength(200);
        builder.Property(a => a.IpAddress).HasMaxLength(50);
        builder.Property(a => a.TransactionId).IsRequired();
        builder.Property(a => a.Data).HasColumnType("jsonb").IsRequired();
        builder.Property(a => a.CreatedAt).HasColumnType("timestamptz").IsRequired();

        builder.HasIndex(a => a.CreatedAt).HasDatabaseName("IX_AuditLogs_CreatedAt");
        builder.HasIndex(a => a.UserId).HasDatabaseName("IX_AuditLogs_UserId");
        builder.HasIndex(a => a.Source).HasDatabaseName("IX_AuditLogs_Source");
        builder.HasIndex(a => a.EntityName).HasDatabaseName("IX_AuditLogs_EntityName");
    }
}
