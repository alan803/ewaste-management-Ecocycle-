using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class added_payement_table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    PaymentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PaymentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<int>(type: "int", nullable: true),
                    PayerType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PayerLoginId = table.Column<int>(type: "int", nullable: true),
                    ReceiverType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReceiverLoginId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RazorpayOrderId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RazorpayPaymentId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RazorpaySignature = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.PaymentId);
                    table.ForeignKey(
                        name: "FK_Payments_Login_PayerLoginId",
                        column: x => x.PayerLoginId,
                        principalTable: "Login",
                        principalColumn: "LoginId");
                    table.ForeignKey(
                        name: "FK_Payments_Login_ReceiverLoginId",
                        column: x => x.ReceiverLoginId,
                        principalTable: "Login",
                        principalColumn: "LoginId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PayerLoginId",
                table: "Payments",
                column: "PayerLoginId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ReceiverLoginId",
                table: "Payments",
                column: "ReceiverLoginId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");
        }
    }
}
