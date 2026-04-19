using Ims.YamiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ims.YamiFlow.Infrastructure.Persistence.Configurations;

public class AuthEventConfiguration : IEntityTypeConfiguration<AuthEvent>
{
    public void Configure(EntityTypeBuilder<AuthEvent> builder)
    {
        builder.ToTable("AuthEvents", "audit");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).UseIdentityByDefaultColumn();

        builder.Property(a => a.EventType).HasMaxLength(50).IsRequired();
        builder.Property(a => a.UserId).HasMaxLength(100);
        builder.Property(a => a.Email).HasMaxLength(200);
        builder.Property(a => a.FailureReason).HasMaxLength(100);
        builder.Property(a => a.IpAddress).HasMaxLength(50);
        builder.Property(a => a.UserAgent).HasMaxLength(500);
        builder.Property(a => a.Location).HasMaxLength(100);
        builder.Property(a => a.CreatedAt).HasColumnType("timestamptz").IsRequired();

        builder.HasIndex(a => a.IpAddress).HasDatabaseName("IX_AuthEvents_IpAddress");
        builder.HasIndex(a => a.UserId).HasDatabaseName("IX_AuthEvents_UserId");
        builder.HasIndex(a => a.CreatedAt).HasDatabaseName("IX_AuthEvents_CreatedAt");
        builder.HasIndex(a => a.Success).HasDatabaseName("IX_AuthEvents_Success");
    }
}
