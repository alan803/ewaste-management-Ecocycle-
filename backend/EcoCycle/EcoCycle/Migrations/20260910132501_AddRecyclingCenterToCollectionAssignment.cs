using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class AddRecyclingCenterToCollectionAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RecyclingCenterId",
                table: "CollectionAssignments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CollectionAssignments_RecyclingCenterId",
                table: "CollectionAssignments",
                column: "RecyclingCenterId");

            migrationBuilder.AddForeignKey(
                name: "FK_CollectionAssignments_RecyclingCenter_RecyclingCenterId",
                table: "CollectionAssignments",
                column: "RecyclingCenterId",
                principalTable: "RecyclingCenter",
                principalColumn: "RecyclingCenterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CollectionAssignments_RecyclingCenter_RecyclingCenterId",
                table: "CollectionAssignments");

            migrationBuilder.DropIndex(
                name: "IX_CollectionAssignments_RecyclingCenterId",
                table: "CollectionAssignments");

            migrationBuilder.DropColumn(
                name: "RecyclingCenterId",
                table: "CollectionAssignments");
        }
    }
}
