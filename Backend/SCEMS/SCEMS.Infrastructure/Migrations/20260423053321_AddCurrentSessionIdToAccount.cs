using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SCEMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrentSessionIdToAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentSessionId",
                table: "Accounts",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TeachingSchedules_Date_StartTime_EndTime",
                table: "TeachingSchedules",
                columns: new[] { "Date", "StartTime", "EndTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TimeSlot_Status",
                table: "Bookings",
                columns: new[] { "TimeSlot", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeachingSchedules_Date_StartTime_EndTime",
                table: "TeachingSchedules");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_TimeSlot_Status",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CurrentSessionId",
                table: "Accounts");
        }
    }
}
