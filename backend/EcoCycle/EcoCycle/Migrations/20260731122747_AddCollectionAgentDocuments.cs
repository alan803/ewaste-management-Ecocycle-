using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    public partial class AddCollectionAgentDocuments : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // No operations required because the columns
            // were already removed manually from the database.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressProof",
                table: "CollectionAgents",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServiceArea",
                table: "CollectionAgents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VehicleCapacity",
                table: "CollectionAgents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}