using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class Add_deviceTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Device",
                columns: table => new
                {
                    DeviceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Model = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModelNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SerialNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Condition = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Working = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    PhysicalDamage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayCondition = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BatteryCondition = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Accessories = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Charger = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    FrontPhoto = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    BackPhoto = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    DamagePhoto = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    LabelPhoto = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ProcessingPreference = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Landmark = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    PickupDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TimeSlot = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PickupInstructions = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Ownership = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    OwnershipConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TermsAccepted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Device", x => x.DeviceId);
                    table.ForeignKey(
                        name: "FK_Device_DeviceCategory_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "DeviceCategory",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Device_CategoryId",
                table: "Device",
                column: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Device");
        }
    }
}
