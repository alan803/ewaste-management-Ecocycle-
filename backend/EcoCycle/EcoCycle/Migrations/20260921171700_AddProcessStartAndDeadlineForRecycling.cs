using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class AddProcessStartAndDeadlineForRecycling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessStartDate",
                table: "RecyclingCenterRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessDeadline",
                table: "RecyclingCenterRequests",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProcessStartDate",
                table: "RecyclingCenterRequests");

            migrationBuilder.DropColumn(
                name: "ProcessDeadline",
                table: "RecyclingCenterRequests");
        }
    }
}
