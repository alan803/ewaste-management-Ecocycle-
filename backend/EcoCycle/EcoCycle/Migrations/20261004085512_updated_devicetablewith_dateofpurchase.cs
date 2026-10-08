using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoCycle.Migrations
{
    /// <inheritdoc />
    public partial class updated_devicetablewith_dateofpurchase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeviceModel]') AND name = 'ReferenceMarketPrice')
                BEGIN
                    ALTER TABLE [DeviceModel] ADD [ReferenceMarketPrice] decimal(18,2) NOT NULL DEFAULT 0.0;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeviceModel]') AND name = 'UpdatedAt')
                BEGIN
                    ALTER TABLE [DeviceModel] ADD [UpdatedAt] datetime2 NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Device]') AND name = 'PurchaseDate')
                BEGIN
                    ALTER TABLE [Device] ADD [PurchaseDate] datetime2 NULL;
                END
            ");

            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'[dbo].[EcoCycleTransactions]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [EcoCycleTransactions] (
                        [TransactionId] int NOT NULL IDENTITY,
                        [DeviceId] int NULL,
                        [TransactionType] nvarchar(50) NOT NULL,
                        [Direction] nvarchar(20) NOT NULL,
                        [Amount] decimal(18,2) NOT NULL,
                        [Status] nvarchar(30) NOT NULL,
                        [Description] nvarchar(500) NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        CONSTRAINT [PK_EcoCycleTransactions] PRIMARY KEY ([TransactionId])
                    );
                END
            ");

            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'[dbo].[Payouts]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [Payouts] (
                        [PayoutId] int NOT NULL IDENTITY,
                        [DeviceId] int NOT NULL,
                        [ReceiverType] nvarchar(50) NOT NULL,
                        [ReceiverLoginId] int NOT NULL,
                        [PayoutType] nvarchar(50) NOT NULL,
                        [Amount] decimal(18,2) NOT NULL,
                        [Currency] nvarchar(10) NOT NULL,
                        [PayoutStatus] nvarchar(30) NOT NULL,
                        [PayoutBatchId] nvarchar(100) NOT NULL,
                        [RazorpayPayoutId] nvarchar(100) NULL,
                        [RazorpayContactId] nvarchar(100) NULL,
                        [RazorpayFundAccountId] nvarchar(100) NULL,
                        [FailureReason] nvarchar(500) NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [PaidAt] datetime2 NULL,
                        [UpdatedAt] datetime2 NULL,
                        CONSTRAINT [PK_Payouts] PRIMARY KEY ([PayoutId]),
                        CONSTRAINT [FK_Payouts_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId]) ON DELETE CASCADE,
                        CONSTRAINT [FK_Payouts_Login_ReceiverLoginId] FOREIGN KEY ([ReceiverLoginId]) REFERENCES [Login] ([LoginId])
                    );
                    CREATE INDEX [IX_Payouts_DeviceId] ON [Payouts] ([DeviceId]);
                    CREATE INDEX [IX_Payouts_ReceiverLoginId] ON [Payouts] ([ReceiverLoginId]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'[dbo].[Payouts]', N'U') IS NOT NULL DROP TABLE [Payouts];
                IF OBJECT_ID(N'[dbo].[EcoCycleTransactions]', N'U') IS NOT NULL DROP TABLE [EcoCycleTransactions];
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Device]') AND name = 'PurchaseDate')
                    ALTER TABLE [Device] DROP COLUMN [PurchaseDate];
            ");
        }
    }
}
