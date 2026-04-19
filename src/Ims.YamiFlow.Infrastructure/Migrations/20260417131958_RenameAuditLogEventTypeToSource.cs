using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ims.YamiFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameAuditLogEventTypeToSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_EventType",
                schema: "audit",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "EventType",
                schema: "audit",
                table: "AuditLogs");

            migrationBuilder.AddColumn<string>(
                name: "Source",
                schema: "audit",
                table: "AuditLogs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "API");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Source",
                schema: "audit",
                table: "AuditLogs",
                column: "Source");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_Source",
                schema: "audit",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "Source",
                schema: "audit",
                table: "AuditLogs");

            migrationBuilder.AddColumn<string>(
                name: "EventType",
                schema: "audit",
                table: "AuditLogs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EventType",
                schema: "audit",
                table: "AuditLogs",
                column: "EventType");
        }
    }
}
