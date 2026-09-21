using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class added_recyclinprocess_table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecyclingProcesses",
                columns: table => new
                {
                    RecyclingProcessId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecyclingCenterRequestId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TotalRecoveredWeight = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TotalMaterialValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ProcessingCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NetRecoveryValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    HazardousWasteWeight = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    HazardousWasteDetails = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DisposalMethod = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecyclingProcesses", x => x.RecyclingProcessId);
                    table.ForeignKey(
                        name: "FK_RecyclingProcesses_RecyclingCenterRequests_RecyclingCenterRequestId",
                        column: x => x.RecyclingCenterRequestId,
                        principalTable: "RecyclingCenterRequests",
                        principalColumn: "RecyclingCenterRequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecyclingProcesses_RecyclingCenterRequestId",
                table: "RecyclingProcesses",
                column: "RecyclingCenterRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecyclingProcesses");
        }
    }
}
