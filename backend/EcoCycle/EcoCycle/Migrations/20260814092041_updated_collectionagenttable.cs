using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_collectionagenttable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CollectionAssignments_CollectionAgents_CollectionAgentId",
                table: "CollectionAssignments");

            migrationBuilder.AlterColumn<int>(
                name: "CollectionAgentId",
                table: "CollectionAssignments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "VehiclePhoto",
                table: "CollectionAgents",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CollectionAssignments_CollectionAgents_CollectionAgentId",
                table: "CollectionAssignments",
                column: "CollectionAgentId",
                principalTable: "CollectionAgents",
                principalColumn: "CollectionAgentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CollectionAssignments_CollectionAgents_CollectionAgentId",
                table: "CollectionAssignments");

            migrationBuilder.DropColumn(
                name: "VehiclePhoto",
                table: "CollectionAgents");

            migrationBuilder.AlterColumn<int>(
                name: "CollectionAgentId",
                table: "CollectionAssignments",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CollectionAssignments_CollectionAgents_CollectionAgentId",
                table: "CollectionAssignments",
                column: "CollectionAgentId",
                principalTable: "CollectionAgents",
                principalColumn: "CollectionAgentId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
