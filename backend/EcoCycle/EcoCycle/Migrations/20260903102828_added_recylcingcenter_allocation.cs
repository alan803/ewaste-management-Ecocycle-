using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class added_recylcingcenter_allocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefurbishmentRequests_Device_DeviceId",
                table: "RefurbishmentRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId",
                table: "RefurbishmentRequests");

            migrationBuilder.CreateTable(
                name: "RecyclingCenterRequests",
                columns: table => new
                {
                    RecyclingCenterRequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceId = table.Column<int>(type: "int", nullable: false),
                    RecyclingCenterId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResponseDeadline = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReassignmentCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecyclingCenterRequests", x => x.RecyclingCenterRequestId);
                    table.ForeignKey(
                        name: "FK_RecyclingCenterRequests_Device_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Device",
                        principalColumn: "DeviceId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecyclingCenterRequests_RecyclingCenter_RecyclingCenterId",
                        column: x => x.RecyclingCenterId,
                        principalTable: "RecyclingCenter",
                        principalColumn: "RecyclingCenterId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecyclingCenterRequests_DeviceId",
                table: "RecyclingCenterRequests",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_RecyclingCenterRequests_RecyclingCenterId",
                table: "RecyclingCenterRequests",
                column: "RecyclingCenterId");

            migrationBuilder.AddForeignKey(
                name: "FK_RefurbishmentRequests_Device_DeviceId",
                table: "RefurbishmentRequests",
                column: "DeviceId",
                principalTable: "Device",
                principalColumn: "DeviceId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId",
                table: "RefurbishmentRequests",
                column: "RefurbishmentCenterId",
                principalTable: "RefurbishmentCenter",
                principalColumn: "RefurbishmentCenterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefurbishmentRequests_Device_DeviceId",
                table: "RefurbishmentRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId",
                table: "RefurbishmentRequests");

            migrationBuilder.DropTable(
                name: "RecyclingCenterRequests");

            migrationBuilder.AddForeignKey(
                name: "FK_RefurbishmentRequests_Device_DeviceId",
                table: "RefurbishmentRequests",
                column: "DeviceId",
                principalTable: "Device",
                principalColumn: "DeviceId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId",
                table: "RefurbishmentRequests",
                column: "RefurbishmentCenterId",
                principalTable: "RefurbishmentCenter",
                principalColumn: "RefurbishmentCenterId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
