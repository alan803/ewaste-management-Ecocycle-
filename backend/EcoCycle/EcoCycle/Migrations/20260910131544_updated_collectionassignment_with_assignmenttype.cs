using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_collectionassignment_with_assignmenttype : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Device_DeviceModelId",
                table: "Device",
                column: "DeviceModelId");

            migrationBuilder.AddForeignKey(
                name: "FK_Device_DeviceModel_DeviceModelId",
                table: "Device",
                column: "DeviceModelId",
                principalTable: "DeviceModel",
                principalColumn: "DeviceModelId",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Device_DeviceModel_DeviceModelId",
                table: "Device");

            migrationBuilder.DropIndex(
                name: "IX_Device_DeviceModelId",
                table: "Device");
        }
    }
}