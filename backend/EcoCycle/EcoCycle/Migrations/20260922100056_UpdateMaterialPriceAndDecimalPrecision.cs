using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMaterialPriceAndDecimalPrecision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ============================================
            // RECYCLING PROCESS DECIMAL PRECISION
            // ============================================

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalRecoveredWeight",
                table: "RecyclingProcesses",
                type: "decimal(18,3)",
                precision: 18,
                scale: 3,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "HazardousWasteWeight",
                table: "RecyclingProcesses",
                type: "decimal(18,3)",
                precision: 18,
                scale: 3,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);


            // ============================================
            // RECOVERED MATERIALS DECIMAL PRECISION
            // ============================================

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "RecoveredMaterials",
                type: "decimal(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");


            // ============================================
            // COLLECTION ASSIGNMENT
            // These columns already exist in the database,
            // so DO NOT add them again.
            // ============================================


            // ============================================
            // RECYCLING CENTER REQUEST
            // ProcessStartDate and ProcessDeadline already
            // exist in the database, so DO NOT add them.
            // ============================================


            // ============================================
            // MATERIAL PRICE
            // ============================================

            migrationBuilder.CreateTable(
                name: "MaterialPrices",
                columns: table => new
                {
                    MaterialPriceId = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),

                    ComponentTypeId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    PricePerKg = table.Column<decimal>(
                        type: "decimal(18,2)",
                        precision: 18,
                        scale: 2,
                        nullable: false),

                    EffectiveFrom = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    EffectiveTo = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true),

                    IsActive = table.Column<bool>(
                        type: "bit",
                        nullable: false),

                    CreatedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false),

                    UpdatedAt = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_MaterialPrices",
                        x => x.MaterialPriceId);

                    table.ForeignKey(
                        name: "FK_MaterialPrices_ComponentTypes_ComponentTypeId",
                        column: x => x.ComponentTypeId,
                        principalTable: "ComponentTypes",
                        principalColumn: "ComponentTypeId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaterialPrices_ComponentTypeId",
                table: "MaterialPrices",
                column: "ComponentTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ============================================
            // REMOVE MATERIAL PRICE TABLE
            // ============================================

            migrationBuilder.DropTable(
                name: "MaterialPrices");


            // ============================================
            // RESTORE DECIMAL PRECISION
            // ============================================

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalRecoveredWeight",
                table: "RecyclingProcesses",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,3)",
                oldPrecision: 18,
                oldScale: 3,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "HazardousWasteWeight",
                table: "RecyclingProcesses",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,3)",
                oldPrecision: 18,
                oldScale: 3,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "RecoveredMaterials",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,3)",
                oldPrecision: 18,
                oldScale: 3);
        }
    }
}