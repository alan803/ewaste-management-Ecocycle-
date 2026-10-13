using EcoCycle.API.Data;
using EcoCycle.API.Models;
using EcoCycle.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddScoped<EmailService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allows localhost and any Vercel/production deployment
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme
)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                "ThisIsMySuperSecretJWTKeyForEcoCycle2026!"
            )
        )
    };
});

builder.Services.AddAuthorization();

builder.Services.Configure<RazorpaySettings>(
    builder.Configuration.GetSection("Razorpay"));

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowReact");

app.UseAuthentication();

app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new { status = "Online", message = "EcoCycle ASP.NET Core API is live!" }));

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.Migrate();
        db.Database.ExecuteSqlRaw(@"
            IF EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'CollectionAgentId' 
                AND is_nullable = 0
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ALTER COLUMN [CollectionAgentId] INT NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'ResponseDeadline'
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ADD [ResponseDeadline] DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'RespondedAt'
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ADD [RespondedAt] DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'ExtensionCount'
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ADD [ExtensionCount] INT NOT NULL DEFAULT 0;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'SourceType'
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ADD [SourceType] NVARCHAR(100) NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'DestinationType'
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ADD [DestinationType] NVARCHAR(100) NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'CompletionDeadline'
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ADD [CompletionDeadline] DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[CollectionAssignments]') 
                AND name = N'RefurbishmentCenterId'
            )
            BEGIN
                ALTER TABLE [dbo].[CollectionAssignments] ADD [RefurbishmentCenterId] INT NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[Device]') 
                AND name = N'DeviceModelId'
            )
            BEGIN
                ALTER TABLE [dbo].[Device] ADD [DeviceModelId] INT NULL;
                ALTER TABLE [dbo].[Device] ADD CONSTRAINT [FK_Device_DeviceModel_DeviceModelId] FOREIGN KEY ([DeviceModelId]) REFERENCES [dbo].[DeviceModel] ([DeviceModelId]) ON DELETE SET NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[DeviceModel]') 
                AND name = N'ReferenceMarketPrice'
            )
            BEGIN
                ALTER TABLE [dbo].[DeviceModel] ADD [ReferenceMarketPrice] DECIMAL(18,2) NOT NULL DEFAULT 5000.00;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[DeviceModel]') 
                AND name = N'UpdatedAt'
            )
            BEGIN
                ALTER TABLE [dbo].[DeviceModel] ADD [UpdatedAt] DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[RecyclingCenterRequests]') 
                AND name = N'ProcessStartDate'
            )
            BEGIN
                ALTER TABLE [dbo].[RecyclingCenterRequests] ADD [ProcessStartDate] DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[RecyclingCenterRequests]') 
                AND name = N'ProcessDeadline'
            )
            BEGIN
                ALTER TABLE [dbo].[RecyclingCenterRequests] ADD [ProcessDeadline] DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[RecyclingProcesses]') 
                AND name = N'CompletionDeadline'
            )
            BEGIN
                ALTER TABLE [dbo].[RecyclingProcesses] ADD [CompletionDeadline] DATETIME2 NULL;
            END

            IF EXISTS (SELECT * FROM sys.tables WHERE name = N'collectionAgentPenalties')
            BEGIN
                DROP TABLE [dbo].[collectionAgentPenalties];
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'technicianPenalties')
            BEGIN
                CREATE TABLE [dbo].[technicianPenalties] (
                    [TechnicianPenaltyId] INT IDENTITY(1,1) NOT NULL,
                    [TechnicianId] INT NOT NULL,
                    [InspectionRequestId] INT NULL,
                    [PenaltyAmount] DECIMAL(18,2) NOT NULL DEFAULT 100.00,
                    [Reason] NVARCHAR(500) NOT NULL DEFAULT '',
                    [Status] NVARCHAR(30) NOT NULL DEFAULT 'Pending',
                    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
                    [ResolvedAt] DATETIME2 NULL,
                    CONSTRAINT [PK_technicianPenalties] PRIMARY KEY CLUSTERED ([TechnicianPenaltyId] ASC)
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Payments')
            BEGIN
                CREATE TABLE [dbo].[Payments] (
                    [PaymentId] INT IDENTITY(1,1) NOT NULL,
                    [PaymentType] NVARCHAR(50) NOT NULL,
                    [ReferenceId] INT NULL,
                    [PayerType] NVARCHAR(50) NOT NULL DEFAULT '',
                    [PayerLoginId] INT NULL,
                    [ReceiverType] NVARCHAR(50) NOT NULL DEFAULT '',
                    [ReceiverLoginId] INT NULL,
                    [Amount] DECIMAL(18,2) NOT NULL,
                    [Currency] NVARCHAR(10) NOT NULL DEFAULT 'INR',
                    [PaymentStatus] NVARCHAR(30) NOT NULL DEFAULT 'Pending',
                    [PaymentMethod] NVARCHAR(50) NULL,
                    [TransactionReference] NVARCHAR(100) NULL,
                    [RazorpayOrderId] NVARCHAR(100) NULL,
                    [RazorpayPaymentId] NVARCHAR(100) NULL,
                    [RazorpaySignature] NVARCHAR(250) NULL,
                    [Description] NVARCHAR(500) NULL,
                    [PaidAt] DATETIME2 NULL,
                    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED ([PaymentId] ASC)
                );
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Payouts')
            BEGIN
                CREATE TABLE [dbo].[Payouts] (
                    [PayoutId] INT IDENTITY(1,1) NOT NULL,
                    [DeviceId] INT NOT NULL,
                    [ReceiverType] NVARCHAR(50) NOT NULL,
                    [ReceiverLoginId] INT NOT NULL,
                    [PayoutType] NVARCHAR(50) NOT NULL,
                    [Amount] DECIMAL(18,2) NOT NULL,
                    [Currency] NVARCHAR(10) NOT NULL DEFAULT 'INR',
                    [PayoutStatus] NVARCHAR(30) NOT NULL DEFAULT 'Pending',
                    [PayoutBatchId] NVARCHAR(100) NOT NULL DEFAULT '',
                    [RazorpayPayoutId] NVARCHAR(100) NULL,
                    [RazorpayContactId] NVARCHAR(100) NULL,
                    [RazorpayFundAccountId] NVARCHAR(100) NULL,
                    [FailureReason] NVARCHAR(500) NULL,
                    [PaidAt] DATETIME2 NULL,
                    [UpdatedAt] DATETIME2 NULL,
                    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [PK_Payouts] PRIMARY KEY CLUSTERED ([PayoutId] ASC),
                    CONSTRAINT [FK_Payouts_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [dbo].[Device] ([DeviceId]) ON DELETE CASCADE
                );
            END
            ELSE
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Payouts]') AND name = N'RazorpayPayoutId')
                    ALTER TABLE [dbo].[Payouts] ADD [RazorpayPayoutId] NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Payouts]') AND name = N'RazorpayContactId')
                    ALTER TABLE [dbo].[Payouts] ADD [RazorpayContactId] NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Payouts]') AND name = N'RazorpayFundAccountId')
                    ALTER TABLE [dbo].[Payouts] ADD [RazorpayFundAccountId] NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Payouts]') AND name = N'FailureReason')
                    ALTER TABLE [dbo].[Payouts] ADD [FailureReason] NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Payouts]') AND name = N'UpdatedAt')
                    ALTER TABLE [dbo].[Payouts] ADD [UpdatedAt] DATETIME2 NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'EcoCycleTransactions')
            BEGIN
                CREATE TABLE [dbo].[EcoCycleTransactions] (
                    [TransactionId] INT IDENTITY(1,1) NOT NULL,
                    [DeviceId] INT NULL,
                    [TransactionType] NVARCHAR(50) NOT NULL,
                    [Direction] NVARCHAR(20) NOT NULL,
                    [Amount] DECIMAL(18,2) NOT NULL,
                    [Status] NVARCHAR(30) NOT NULL DEFAULT 'Completed',
                    [Description] NVARCHAR(500) NULL,
                    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [PK_EcoCycleTransactions] PRIMARY KEY CLUSTERED ([TransactionId] ASC)
                );
            END
            ELSE
            BEGIN
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[EcoCycleTransactions]') AND name = N'EcoCycleTransactionId')
                BEGIN
                    DROP TABLE [dbo].[EcoCycleTransactions];
                    CREATE TABLE [dbo].[EcoCycleTransactions] (
                        [TransactionId] INT IDENTITY(1,1) NOT NULL,
                        [DeviceId] INT NULL,
                        [TransactionType] NVARCHAR(50) NOT NULL,
                        [Direction] NVARCHAR(20) NOT NULL,
                        [Amount] DECIMAL(18,2) NOT NULL,
                        [Status] NVARCHAR(30) NOT NULL DEFAULT 'Completed',
                        [Description] NVARCHAR(500) NULL,
                        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
                        CONSTRAINT [PK_EcoCycleTransactions] PRIMARY KEY CLUSTERED ([TransactionId] ASC)
                    );
                END
            END
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Database auto-migration error: " + ex.Message);
    }
}


app.MapControllers();

app.Run();