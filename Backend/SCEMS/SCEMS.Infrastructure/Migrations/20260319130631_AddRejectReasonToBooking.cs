using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SCEMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRejectReasonToBooking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectReason",
                table: "Bookings",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectReason",
                table: "Bookings");
        }
    }
}
