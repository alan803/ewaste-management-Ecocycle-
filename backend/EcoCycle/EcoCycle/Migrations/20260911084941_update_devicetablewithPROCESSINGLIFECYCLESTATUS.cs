using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class update_devicetablewithPROCESSINGLIFECYCLESTATUS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProcessingLifecycleStatus",
                table: "Device",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProcessingLifecycleStatus",
                table: "Device");
        }
    }
}
