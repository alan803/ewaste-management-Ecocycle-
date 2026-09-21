using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_tablefor_findinghardzous_components : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ComponentTypes",
                columns: table => new
                {
                    ComponentTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ComponentName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    HandlingType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentTypes", x => x.ComponentTypeId);
                });

            migrationBuilder.CreateTable(
                name: "DeviceModelComponents",
                columns: table => new
                {
                    DeviceModelComponentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceModelId = table.Column<int>(type: "int", nullable: false),
                    ComponentTypeId = table.Column<int>(type: "int", nullable: false),
                    IsExpected = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceModelComponents", x => x.DeviceModelComponentId);
                    table.ForeignKey(
                        name: "FK_DeviceModelComponents_ComponentTypes_ComponentTypeId",
                        column: x => x.ComponentTypeId,
                        principalTable: "ComponentTypes",
                        principalColumn: "ComponentTypeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeviceModelComponents_DeviceModel_DeviceModelId",
                        column: x => x.DeviceModelId,
                        principalTable: "DeviceModel",
                        principalColumn: "DeviceModelId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeviceModelComponents_ComponentTypeId",
                table: "DeviceModelComponents",
                column: "ComponentTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceModelComponents_DeviceModelId",
                table: "DeviceModelComponents",
                column: "DeviceModelId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeviceModelComponents");

            migrationBuilder.DropTable(
                name: "ComponentTypes");
        }
    }
}
