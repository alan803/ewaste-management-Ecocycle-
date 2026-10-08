using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class AddRefurbishmentProcessTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RefurbishmentProcesses",
                columns: table => new
                {
                    RefurbishmentProcessId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RefurbishmentRequestId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeviceVerified = table.Column<bool>(type: "bit", nullable: false),
                    VerifiedByTechnician = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PhysicalCondition = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DisplayCondition = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BatteryAssessment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    KeyboardAssessment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    StorageAssessment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RamAssessment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PortsAssessment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SoftwareAssessment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EstimatedRepairCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AssessmentDecision = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DataWiped = table.Column<bool>(type: "bit", nullable: false),
                    WipingMethod = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    WipingCompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    WipingTechnician = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    WipingVerificationStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CertificateNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RepairItemsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalRepairCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    FunctionalTestsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TestingPassed = table.Column<bool>(type: "bit", nullable: false),
                    QcRepairCompleted = table.Column<bool>(type: "bit", nullable: false),
                    QcDataWiped = table.Column<bool>(type: "bit", nullable: false),
                    QcHardwareTested = table.Column<bool>(type: "bit", nullable: false),
                    QcSoftwareTested = table.Column<bool>(type: "bit", nullable: false),
                    QcApproved = table.Column<bool>(type: "bit", nullable: false),
                    QualityGrade = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    QcInspector = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FinalOutcome = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RefurbishedValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WarrantyDuration = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RefurbishedCertificateNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefurbishmentProcesses", x => x.RefurbishmentProcessId);
                    table.ForeignKey(
                        name: "FK_RefurbishmentProcesses_RefurbishmentRequests_RefurbishmentRequestId",
                        column: x => x.RefurbishmentRequestId,
                        principalTable: "RefurbishmentRequests",
                        principalColumn: "RefurbishmentRequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefurbishmentProcesses_RefurbishmentRequestId",
                table: "RefurbishmentProcesses",
                column: "RefurbishmentRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefurbishmentProcesses");
        }
    }
}
