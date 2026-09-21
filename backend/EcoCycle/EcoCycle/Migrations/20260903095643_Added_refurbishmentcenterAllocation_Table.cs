using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class Added_refurbishmentcenterAllocation_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RefurbishmentRequests",
                columns: table => new
                {
                    RefurbishmentRequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceId = table.Column<int>(type: "int", nullable: false),
                    RefurbishmentCenterId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResponseDeadline = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RefurbishmentStartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RefurbishmentCompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReassignmentCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefurbishmentRequests", x => x.RefurbishmentRequestId);
                    table.ForeignKey(
                        name: "FK_RefurbishmentRequests_Device_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Device",
                        principalColumn: "DeviceId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId",
                        column: x => x.RefurbishmentCenterId,
                        principalTable: "RefurbishmentCenter",
                        principalColumn: "RefurbishmentCenterId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefurbishmentRequests_DeviceId",
                table: "RefurbishmentRequests",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_RefurbishmentRequests_RefurbishmentCenterId",
                table: "RefurbishmentRequests",
                column: "RefurbishmentCenterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefurbishmentRequests");
        }
    }
}
