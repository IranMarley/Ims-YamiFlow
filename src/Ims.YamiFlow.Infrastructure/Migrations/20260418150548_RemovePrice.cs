using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ims.YamiFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemovePrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PricePaid",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PromotionExpiresAt",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "PromotionalPrice",
                table: "Courses");

            migrationBuilder.AddColumn<bool>(
                name: "IsFree",
                table: "Courses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFree",
                table: "Courses");

            migrationBuilder.AddColumn<decimal>(
                name: "PricePaid",
                table: "Enrollments",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Courses",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "PromotionExpiresAt",
                table: "Courses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PromotionalPrice",
                table: "Courses",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);
        }
    }
}
