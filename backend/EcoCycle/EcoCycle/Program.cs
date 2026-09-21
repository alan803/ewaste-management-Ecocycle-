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
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
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
app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseCors("AllowReact");

app.UseAuthentication();

app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
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
                WHERE object_id = OBJECT_ID(N'[dbo].[Device]') 
                AND name = N'DeviceModelId'
            )
            BEGIN
                ALTER TABLE [dbo].[Device] ADD [DeviceModelId] INT NULL;
                ALTER TABLE [dbo].[Device] ADD CONSTRAINT [FK_Device_DeviceModel_DeviceModelId] FOREIGN KEY ([DeviceModelId]) REFERENCES [dbo].[DeviceModel] ([DeviceModelId]) ON DELETE SET NULL;
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
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Database auto-migration error: " + ex.Message);
    }
}


app.MapControllers();

app.Run();