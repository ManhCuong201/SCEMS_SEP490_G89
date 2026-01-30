using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SCEMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTeachingScheduleTimes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndSlot",
                table: "TeachingSchedules");

            migrationBuilder.DropColumn(
                name: "StartSlot",
                table: "TeachingSchedules");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "EndTime",
                table: "TeachingSchedules",
                type: "time(6)",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<TimeSpan>(
                name: "StartTime",
                table: "TeachingSchedules",
                type: "time(6)",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "TeachingSchedules");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "TeachingSchedules");

            migrationBuilder.AddColumn<int>(
                name: "EndSlot",
                table: "TeachingSchedules",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StartSlot",
                table: "TeachingSchedules",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
