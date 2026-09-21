using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class added_technicanpenalty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "technicianPenalties",
                columns: table => new
                {
                    TechnicianPenaltyId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TechnicianId = table.Column<int>(type: "int", nullable: false),
                    DeviceId = table.Column<int>(type: "int", nullable: false),
                    InspectionRequestId = table.Column<int>(type: "int", nullable: true),
                    PenaltyAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_technicianPenalties", x => x.TechnicianPenaltyId);
                    table.ForeignKey(
                        name: "FK_technicianPenalties_Device_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Device",
                        principalColumn: "DeviceId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_technicianPenalties_InspectionRequest_InspectionRequestId",
                        column: x => x.InspectionRequestId,
                        principalTable: "InspectionRequest",
                        principalColumn: "InspectionRequestId");
                    table.ForeignKey(
                        name: "FK_technicianPenalties_Technician_TechnicianId",
                        column: x => x.TechnicianId,
                        principalTable: "Technician",
                        principalColumn: "TechnicianId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_technicianPenalties_DeviceId",
                table: "technicianPenalties",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_technicianPenalties_InspectionRequestId",
                table: "technicianPenalties",
                column: "InspectionRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_technicianPenalties_TechnicianId",
                table: "technicianPenalties",
                column: "TechnicianId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "technicianPenalties");
        }
    }
}
