using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_inspectiontable_with_newfiled_extensionCOUNT : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExtensionCount",
                table: "Inspection",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtensionCount",
                table: "Inspection");
        }
    }
}
