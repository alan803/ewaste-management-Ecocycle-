using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class AddRecyclingCentertable2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecyclingCenter",
                columns: table => new
                {
                    RecyclingCenterId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoginId = table.Column<int>(type: "int", nullable: false),
                    CenterName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OwnerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BusinessRegistrationNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GstNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExperienceYears = table.Column<int>(type: "int", nullable: false),
                    RecyclerRegistrationNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BuildingNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Street = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    District = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    State = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Pincode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeviceTypes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecyclingProcesses = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PickupAvailable = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HazardousWasteHandling = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecoveredMaterials = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HazardousWasteTypes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessRegistrationCertificate = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecyclerRegistrationCertificate = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConsentToOperate = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HazardousWasteAuthorization = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AddressProof = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CenterPhoto = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AuthorizedPersonId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecyclingCenter", x => x.RecyclingCenterId);
                    table.ForeignKey(
                        name: "FK_RecyclingCenter_Login_LoginId",
                        column: x => x.LoginId,
                        principalTable: "Login",
                        principalColumn: "LoginId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecyclingCenter_LoginId",
                table: "RecyclingCenter",
                column: "LoginId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecyclingCenter");
        }
    }
}
