using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_deliverytable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HandoverRejectedAt",
                table: "Deliveries",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HandoverRejectionReason",
                table: "Deliveries",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechnicianNotes",
                table: "Deliveries",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HandoverRejectedAt",
                table: "Deliveries");

            migrationBuilder.DropColumn(
                name: "HandoverRejectionReason",
                table: "Deliveries");

            migrationBuilder.DropColumn(
                name: "TechnicianNotes",
                table: "Deliveries");
        }
    }
}
