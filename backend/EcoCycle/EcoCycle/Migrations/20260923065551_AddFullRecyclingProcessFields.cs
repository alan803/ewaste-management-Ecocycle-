using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class AddFullRecyclingProcessFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BatteryCondition",
                table: "RecyclingProcesses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataFound",
                table: "RecyclingProcesses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DispatchDestination",
                table: "RecyclingProcesses",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HazardousComponentsJson",
                table: "RecyclingProcesses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HazardousStorageArea",
                table: "RecyclingProcesses",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MissingParts",
                table: "RecyclingProcesses",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PackagingContainer",
                table: "RecyclingProcesses",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RemovedComponentsJson",
                table: "RecyclingProcesses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ResidualWasteWeight",
                table: "RecyclingProcesses",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SanitizationMethod",
                table: "RecyclingProcesses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SanitizationPerformed",
                table: "RecyclingProcesses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisibleDamage",
                table: "RecyclingProcesses",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BatteryCondition",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "DataFound",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "DispatchDestination",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "HazardousComponentsJson",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "HazardousStorageArea",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "MissingParts",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "PackagingContainer",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "RemovedComponentsJson",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "ResidualWasteWeight",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "SanitizationMethod",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "SanitizationPerformed",
                table: "RecyclingProcesses");

            migrationBuilder.DropColumn(
                name: "VisibleDamage",
                table: "RecyclingProcesses");
        }
    }
}
