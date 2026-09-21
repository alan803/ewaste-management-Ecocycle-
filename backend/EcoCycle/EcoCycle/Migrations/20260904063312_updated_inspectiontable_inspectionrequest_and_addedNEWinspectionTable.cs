using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InspectionResult_InspectionRequest_InspectionRequestId",
                table: "InspectionResult");

            migrationBuilder.DropColumn(
                name: "InspectionCompletedAt",
                table: "InspectionRequest");

            migrationBuilder.DropColumn(
                name: "InspectionDeadline",
                table: "InspectionRequest");

            migrationBuilder.DropColumn(
                name: "InspectionStartedAt",
                table: "InspectionRequest");

            migrationBuilder.RenameColumn(
                name: "InspectionRequestId",
                table: "InspectionResult",
                newName: "InspectionId");

            migrationBuilder.RenameIndex(
                name: "IX_InspectionResult_InspectionRequestId",
                table: "InspectionResult",
                newName: "IX_InspectionResult_InspectionId");

            migrationBuilder.CreateTable(
                name: "Inspection",
                columns: table => new
                {
                    InspectionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InspectionRequestId = table.Column<int>(type: "int", nullable: false),
                    DeviceId = table.Column<int>(type: "int", nullable: false),
                    TechnicianId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    InspectionStartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InspectionDeadline = table.Column<DateTime>(type: "datetime2", nullable: true),
                    InspectionCompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OverallScore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    OverallCondition = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RecommendedAction = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TechnicianRemarks = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Inspection", x => x.InspectionId);
                    table.ForeignKey(
                        name: "FK_Inspection_Device_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Device",
                        principalColumn: "DeviceId");
                    table.ForeignKey(
                        name: "FK_Inspection_InspectionRequest_InspectionRequestId",
                        column: x => x.InspectionRequestId,
                        principalTable: "InspectionRequest",
                        principalColumn: "InspectionRequestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Inspection_Technician_TechnicianId",
                        column: x => x.TechnicianId,
                        principalTable: "Technician",
                        principalColumn: "TechnicianId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Inspection_DeviceId",
                table: "Inspection",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_Inspection_InspectionRequestId",
                table: "Inspection",
                column: "InspectionRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Inspection_TechnicianId",
                table: "Inspection",
                column: "TechnicianId");

            migrationBuilder.AddForeignKey(
                name: "FK_InspectionResult_Inspection_InspectionId",
                table: "InspectionResult",
                column: "InspectionId",
                principalTable: "Inspection",
                principalColumn: "InspectionId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InspectionResult_Inspection_InspectionId",
                table: "InspectionResult");

            migrationBuilder.DropTable(
                name: "Inspection");

            migrationBuilder.RenameColumn(
                name: "InspectionId",
                table: "InspectionResult",
                newName: "InspectionRequestId");

            migrationBuilder.RenameIndex(
                name: "IX_InspectionResult_InspectionId",
                table: "InspectionResult",
                newName: "IX_InspectionResult_InspectionRequestId");

            migrationBuilder.AddColumn<DateTime>(
                name: "InspectionCompletedAt",
                table: "InspectionRequest",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InspectionDeadline",
                table: "InspectionRequest",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InspectionStartedAt",
                table: "InspectionRequest",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_InspectionResult_InspectionRequest_InspectionRequestId",
                table: "InspectionResult",
                column: "InspectionRequestId",
                principalTable: "InspectionRequest",
                principalColumn: "InspectionRequestId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
