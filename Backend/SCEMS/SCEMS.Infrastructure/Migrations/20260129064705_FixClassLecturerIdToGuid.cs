using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SCEMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixClassLecturerIdToGuid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Accounts_LecturerId",
                table: "Classes");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Accounts_Email",
                table: "Accounts");

            migrationBuilder.AlterColumn<Guid>(
                name: "LecturerId",
                table: "Classes",
                type: "char(36)",
                nullable: false,
                collation: "ascii_general_ci",
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Accounts_LecturerId",
                table: "Classes",
                column: "LecturerId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Classes_Accounts_LecturerId",
                table: "Classes");

            migrationBuilder.AlterColumn<string>(
                name: "LecturerId",
                table: "Classes",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Accounts_Email",
                table: "Accounts",
                column: "Email");

            migrationBuilder.AddForeignKey(
                name: "FK_Classes_Accounts_LecturerId",
                table: "Classes",
                column: "LecturerId",
                principalTable: "Accounts",
                principalColumn: "Email",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
