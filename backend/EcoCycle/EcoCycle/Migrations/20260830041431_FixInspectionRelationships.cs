using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class FixInspectionRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InspectionCriteria",
                columns: table => new
                {
                    InspectionCriteriaId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    CriteriaName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "InspectionResult",
                columns: table => new
                {
                    InspectionResultId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InspectionRequestId = table.Column<int>(type: "int", nullable: false),
                    InspectionCriteriaId = table.Column<int>(type: "int", nullable: false),
                    Result = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Score = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InspectionResult", x => x.InspectionResultId);
                    table.ForeignKey(
                        name: "FK_InspectionResult_InspectionCriteria_InspectionCriteriaId",
                        column: x => x.InspectionCriteriaId,
                        principalTable: "InspectionCriteria",
                        principalColumn: "InspectionCriteriaId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InspectionResult_InspectionRequest_InspectionRequestId",
                        column: x => x.InspectionRequestId,
                        principalTable: "InspectionRequest",
                        principalColumn: "InspectionRequestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InspectionPhoto",
                columns: table => new
                {
                    InspectionPhotoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InspectionResultId = table.Column<int>(type: "int", nullable: false),
                    PhotoPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PhotoType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InspectionPhoto", x => x.InspectionPhotoId);
                    table.ForeignKey(
                        name: "FK_InspectionPhoto_InspectionResult_InspectionResultId",
                        column: x => x.InspectionResultId,
                        principalTable: "InspectionResult",
                        principalColumn: "InspectionResultId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InspectionCriteria_CategoryId",
                table: "InspectionCriteria",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_InspectionPhoto_InspectionResultId",
                table: "InspectionPhoto",
                column: "InspectionResultId");

            migrationBuilder.CreateIndex(
                name: "IX_InspectionResult_InspectionCriteriaId",
                table: "InspectionResult",
                column: "InspectionCriteriaId");

            migrationBuilder.CreateIndex(
                name: "IX_InspectionResult_InspectionRequestId",
                table: "InspectionResult",
                column: "InspectionRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InspectionPhoto");

            migrationBuilder.DropTable(
                name: "InspectionResult");

            migrationBuilder.DropTable(
                name: "InspectionCriteria");
        }
    }
}
