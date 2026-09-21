using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_devicetablewithinspectionresult : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InspectionResult_InspectionCriteria_InspectionCriteriaId",
                table: "InspectionResult");

            migrationBuilder.DropTable(
                name: "InspectionCriteria");

            migrationBuilder.DropIndex(
                name: "IX_InspectionResult_InspectionCriteriaId",
                table: "InspectionResult");

            migrationBuilder.DropColumn(
                name: "InspectionCriteriaId",
                table: "InspectionResult");

            migrationBuilder.AddColumn<string>(
                name: "CriteriaName",
                table: "InspectionResult",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProcessingDecision",
                table: "Device",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessingDecisionAt",
                table: "Device",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CriteriaName",
                table: "InspectionResult");

            migrationBuilder.DropColumn(
                name: "ProcessingDecision",
                table: "Device");

            migrationBuilder.DropColumn(
                name: "ProcessingDecisionAt",
                table: "Device");

            migrationBuilder.AddColumn<int>(
                name: "InspectionCriteriaId",
                table: "InspectionResult",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "InspectionCriteria",
                columns: table => new
                {
                    InspectionCriteriaId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CriteriaName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InspectionCriteria", x => x.InspectionCriteriaId);
                    table.ForeignKey(
                        name: "FK_InspectionCriteria_DeviceCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "DeviceCategory",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InspectionResult_InspectionCriteriaId",
                table: "InspectionResult",
                column: "InspectionCriteriaId");

            migrationBuilder.CreateIndex(
                name: "IX_InspectionCriteria_CategoryId",
                table: "InspectionCriteria",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_InspectionResult_InspectionCriteria_InspectionCriteriaId",
                table: "InspectionResult",
                column: "InspectionCriteriaId",
                principalTable: "InspectionCriteria",
                principalColumn: "InspectionCriteriaId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
