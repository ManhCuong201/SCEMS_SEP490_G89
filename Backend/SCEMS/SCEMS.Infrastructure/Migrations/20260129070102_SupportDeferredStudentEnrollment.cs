using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SCEMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SupportDeferredStudentEnrollment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassStudents_Accounts_StudentId",
                table: "ClassStudents");

            migrationBuilder.AlterColumn<Guid>(
                name: "StudentId",
                table: "ClassStudents",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "PendingStudentIdentifier",
                table: "ClassStudents",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassStudents_Accounts_StudentId",
                table: "ClassStudents",
                column: "StudentId",
                principalTable: "Accounts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClassStudents_Accounts_StudentId",
                table: "ClassStudents");

            migrationBuilder.DropColumn(
                name: "PendingStudentIdentifier",
                table: "ClassStudents");

            migrationBuilder.AlterColumn<Guid>(
                name: "StudentId",
                table: "ClassStudents",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddForeignKey(
                name: "FK_ClassStudents_Accounts_StudentId",
                table: "ClassStudents",
                column: "StudentId",
                principalTable: "Accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
