IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE TABLE [Roles] (
        [RoleId] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([RoleId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE TABLE [Login] (
        [LoginId] int NOT NULL IDENTITY,
        [Email] nvarchar(100) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [RoleId] int NOT NULL,
        [LastLogin] datetime2 NULL,
        CONSTRAINT [PK_Login] PRIMARY KEY ([LoginId]),
        CONSTRAINT [FK_Login_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([RoleId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE TABLE [CollectionAgents] (
        [CollectionAgentId] int NOT NULL IDENTITY,
        [LoginId] int NOT NULL,
        [FirstName] nvarchar(max) NOT NULL,
        [LastName] nvarchar(max) NOT NULL,
        [Phone] nvarchar(max) NOT NULL,
        [AlternatePhone] nvarchar(max) NULL,
        [ProfilePicture] nvarchar(max) NULL,
        [DOB] datetime2 NOT NULL,
        [Gender] nvarchar(max) NOT NULL,
        [AdhaarNumber] nvarchar(max) NOT NULL,
        [AdhaarProof] nvarchar(max) NULL,
        [AddressProof] nvarchar(max) NULL,
        [Address] nvarchar(max) NOT NULL,
        [State] nvarchar(max) NOT NULL,
        [District] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [Pincode] nvarchar(max) NOT NULL,
        [ServiceArea] nvarchar(max) NOT NULL,
        [VehicleType] nvarchar(max) NOT NULL,
        [VehicleNumber] nvarchar(max) NOT NULL,
        [VehicleInsurance] nvarchar(max) NULL,
        [VehiclePollution] nvarchar(max) NULL,
        [VehicleCapacity] nvarchar(max) NOT NULL,
        [LicenseNumber] nvarchar(max) NOT NULL,
        [AccountHolder] nvarchar(max) NOT NULL,
        [BankName] nvarchar(max) NOT NULL,
        [AccountNumber] nvarchar(max) NOT NULL,
        [IFSCCode] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CollectionAgents] PRIMARY KEY ([CollectionAgentId]),
        CONSTRAINT [FK_CollectionAgents_Login_LoginId] FOREIGN KEY ([LoginId]) REFERENCES [Login] ([LoginId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE TABLE [Users] (
        [UserId] int NOT NULL IDENTITY,
        [LoginId] int NOT NULL,
        [FirstName] nvarchar(50) NOT NULL,
        [LastName] nvarchar(50) NOT NULL,
        [PhoneNumber] nvarchar(15) NOT NULL,
        [Address] nvarchar(255) NOT NULL,
        [State] nvarchar(50) NOT NULL,
        [City] nvarchar(50) NOT NULL,
        [Pincode] nvarchar(10) NOT NULL,
        [Gender] nvarchar(10) NOT NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([UserId]),
        CONSTRAINT [FK_Users_Login_LoginId] FOREIGN KEY ([LoginId]) REFERENCES [Login] ([LoginId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_CollectionAgents_LoginId] ON [CollectionAgents] ([LoginId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Login_Email] ON [Login] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Login_RoleId] ON [Login] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    CREATE INDEX [IX_Users_LoginId] ON [Users] ([LoginId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731050011_InitialSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260731050011_InitialSchema', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731122747_AddCollectionAgentDocuments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260731122747_AddCollectionAgentDocuments', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731154616_AddDistrictToUser'
)
BEGIN
    ALTER TABLE [Users] ADD [District] nvarchar(50) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731154616_AddDistrictToUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260731154616_AddDistrictToUser', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801055350_addtechniciantable'
)
BEGIN
    CREATE TABLE [Technician] (
        [TechnicianId] int NOT NULL IDENTITY,
        [LoginId] int NOT NULL,
        [FirstName] nvarchar(max) NOT NULL,
        [LastName] nvarchar(max) NOT NULL,
        [PhoneNumber] nvarchar(max) NOT NULL,
        [ProfilePhoto] nvarchar(max) NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [Gender] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [State] nvarchar(max) NOT NULL,
        [District] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [PinCode] nvarchar(max) NOT NULL,
        [InspectionCenterName] nvarchar(max) NOT NULL,
        [EmployeeId] nvarchar(max) NOT NULL,
        [JobTitle] nvarchar(max) NOT NULL,
        [DateOfJoining] datetime2 NOT NULL,
        [ExperienceYears] int NOT NULL,
        [Specialization] nvarchar(max) NOT NULL,
        [IssuingInstitute] nvarchar(max) NOT NULL,
        [CertificateNumber] nvarchar(max) NOT NULL,
        [CertificateIssueDate] datetime2 NOT NULL,
        [CertificateExpiryDate] datetime2 NULL,
        [GovernmentIdType] nvarchar(max) NOT NULL,
        [GovernmentIdNumber] nvarchar(max) NOT NULL,
        [GovernmentIdFile] nvarchar(max) NULL,
        [EmployeeIdCard] nvarchar(max) NOT NULL,
        [TechnicalCertificate] nvarchar(max) NOT NULL,
        [Resume] nvarchar(max) NULL,
        [Status] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Technician] PRIMARY KEY ([TechnicianId]),
        CONSTRAINT [FK_Technician_Login_LoginId] FOREIGN KEY ([LoginId]) REFERENCES [Login] ([LoginId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801055350_addtechniciantable'
)
BEGIN
    CREATE INDEX [IX_Technician_LoginId] ON [Technician] ([LoginId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801055350_addtechniciantable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260801055350_addtechniciantable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801131748_AddRefurbishmentCenter'
)
BEGIN
    CREATE TABLE [RefurbishmentCenter] (
        [RefurbishmentCenterId] int NOT NULL IDENTITY,
        [LoginId] int NOT NULL,
        [CenterName] nvarchar(max) NOT NULL,
        [OwnerName] nvarchar(max) NOT NULL,
        [PhoneNumber] nvarchar(max) NOT NULL,
        [BusinessRegistrationNumber] nvarchar(max) NOT NULL,
        [GstNumber] nvarchar(max) NULL,
        [ExperienceYears] int NOT NULL,
        [LicenseNumber] nvarchar(max) NULL,
        [BuildingNumber] nvarchar(max) NOT NULL,
        [Street] nvarchar(max) NOT NULL,
        [District] nvarchar(max) NOT NULL,
        [State] nvarchar(max) NOT NULL,
        [Pincode] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [DeviceTypes] nvarchar(max) NOT NULL,
        [Services] nvarchar(max) NOT NULL,
        [TechnicianCount] int NOT NULL,
        [PickupAvailable] nvarchar(max) NOT NULL,
        [BusinessRegistrationCertificate] nvarchar(max) NOT NULL,
        [TradeLicense] nvarchar(max) NOT NULL,
        [AddressProof] nvarchar(max) NOT NULL,
        [CenterPhoto] nvarchar(max) NOT NULL,
        [AuthorizedPersonId] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RefurbishmentCenter] PRIMARY KEY ([RefurbishmentCenterId]),
        CONSTRAINT [FK_RefurbishmentCenter_Login_LoginId] FOREIGN KEY ([LoginId]) REFERENCES [Login] ([LoginId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801131748_AddRefurbishmentCenter'
)
BEGIN
    CREATE INDEX [IX_RefurbishmentCenter_LoginId] ON [RefurbishmentCenter] ([LoginId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801131748_AddRefurbishmentCenter'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260801131748_AddRefurbishmentCenter', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801164312_AddRecyclingCentertable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260801164312_AddRecyclingCentertable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801164549_AddRecyclingCentertable2'
)
BEGIN
    CREATE TABLE [RecyclingCenter] (
        [RecyclingCenterId] int NOT NULL IDENTITY,
        [LoginId] int NOT NULL,
        [CenterName] nvarchar(max) NOT NULL,
        [OwnerName] nvarchar(max) NOT NULL,
        [PhoneNumber] nvarchar(max) NOT NULL,
        [BusinessRegistrationNumber] nvarchar(max) NOT NULL,
        [GstNumber] nvarchar(max) NULL,
        [ExperienceYears] int NOT NULL,
        [RecyclerRegistrationNumber] nvarchar(max) NOT NULL,
        [BuildingNumber] nvarchar(max) NOT NULL,
        [Street] nvarchar(max) NOT NULL,
        [District] nvarchar(max) NOT NULL,
        [State] nvarchar(max) NOT NULL,
        [Pincode] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [DeviceTypes] nvarchar(max) NOT NULL,
        [RecyclingProcesses] nvarchar(max) NOT NULL,
        [PickupAvailable] nvarchar(max) NOT NULL,
        [HazardousWasteHandling] nvarchar(max) NOT NULL,
        [RecoveredMaterials] nvarchar(max) NOT NULL,
        [HazardousWasteTypes] nvarchar(max) NULL,
        [BusinessRegistrationCertificate] nvarchar(max) NULL,
        [RecyclerRegistrationCertificate] nvarchar(max) NULL,
        [ConsentToOperate] nvarchar(max) NULL,
        [HazardousWasteAuthorization] nvarchar(max) NULL,
        [AddressProof] nvarchar(max) NULL,
        [CenterPhoto] nvarchar(max) NULL,
        [AuthorizedPersonId] nvarchar(max) NULL,
        [Status] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RecyclingCenter] PRIMARY KEY ([RecyclingCenterId]),
        CONSTRAINT [FK_RecyclingCenter_Login_LoginId] FOREIGN KEY ([LoginId]) REFERENCES [Login] ([LoginId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801164549_AddRecyclingCentertable2'
)
BEGIN
    CREATE INDEX [IX_RecyclingCenter_LoginId] ON [RecyclingCenter] ([LoginId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260801164549_AddRecyclingCentertable2'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260801164549_AddRecyclingCentertable2', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802063938_AddPasswordResetFields'
)
BEGIN
    ALTER TABLE [Login] ADD [PasswordResetToken] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802063938_AddPasswordResetFields'
)
BEGIN
    ALTER TABLE [Login] ADD [PasswordResetTokenExpiry] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260802063938_AddPasswordResetFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260802063938_AddPasswordResetFields', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804071918_add_devicecategroytable'
)
BEGIN
    CREATE TABLE [DeviceCategory] (
        [CategoryId] int NOT NULL IDENTITY,
        [CategoryName] nvarchar(100) NOT NULL,
        [Description] nvarchar(255) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_DeviceCategory] PRIMARY KEY ([CategoryId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804071918_add_devicecategroytable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804071918_add_devicecategroytable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804123050_Add_deviceTable'
)
BEGIN
    CREATE TABLE [Device] (
        [DeviceId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [CategoryId] int NOT NULL,
        [Brand] nvarchar(100) NOT NULL,
        [Model] nvarchar(100) NOT NULL,
        [ModelNumber] nvarchar(100) NULL,
        [SerialNumber] nvarchar(100) NULL,
        [Quantity] int NOT NULL,
        [Condition] nvarchar(30) NOT NULL,
        [Working] nvarchar(30) NULL,
        [PhysicalDamage] nvarchar(500) NULL,
        [DisplayCondition] nvarchar(50) NULL,
        [BatteryCondition] nvarchar(50) NULL,
        [Accessories] nvarchar(30) NULL,
        [Charger] nvarchar(30) NULL,
        [FrontPhoto] nvarchar(255) NULL,
        [BackPhoto] nvarchar(255) NULL,
        [DamagePhoto] nvarchar(255) NULL,
        [LabelPhoto] nvarchar(255) NULL,
        [ProcessingPreference] nvarchar(30) NOT NULL,
        [Address] nvarchar(500) NOT NULL,
        [Landmark] nvarchar(150) NULL,
        [PickupDate] datetime2 NOT NULL,
        [TimeSlot] nvarchar(30) NOT NULL,
        [PickupInstructions] nvarchar(500) NULL,
        [Ownership] nvarchar(30) NOT NULL,
        [OwnershipConfirmed] bit NOT NULL,
        [TermsAccepted] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        CONSTRAINT [PK_Device] PRIMARY KEY ([DeviceId]),
        CONSTRAINT [FK_Device_DeviceCategory_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [DeviceCategory] ([CategoryId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804123050_Add_deviceTable'
)
BEGIN
    CREATE INDEX [IX_Device_CategoryId] ON [Device] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804123050_Add_deviceTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804123050_Add_deviceTable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807085405_Add_InspectionRequesttable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807085405_Add_InspectionRequesttable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807085809_AddInspectionRequest'
)
BEGIN
    CREATE TABLE [InspectionRequest] (
        [InspectionRequestId] int NOT NULL IDENTITY,
        [DeviceId] int NOT NULL,
        [TechnicianId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [AssignedAt] datetime2 NOT NULL,
        [ResponseDeadline] datetime2 NOT NULL,
        [RespondedAt] datetime2 NULL,
        [RejectionReason] nvarchar(500) NULL,
        [InspectionStartedAt] datetime2 NULL,
        [InspectionDeadline] datetime2 NULL,
        [InspectionCompletedAt] datetime2 NULL,
        [ReassignmentCount] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_InspectionRequest] PRIMARY KEY ([InspectionRequestId]),
        CONSTRAINT [FK_InspectionRequest_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId]) ON DELETE CASCADE,
        CONSTRAINT [FK_InspectionRequest_Technician_TechnicianId] FOREIGN KEY ([TechnicianId]) REFERENCES [Technician] ([TechnicianId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807085809_AddInspectionRequest'
)
BEGIN
    CREATE INDEX [IX_InspectionRequest_DeviceId] ON [InspectionRequest] ([DeviceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807085809_AddInspectionRequest'
)
BEGIN
    CREATE INDEX [IX_InspectionRequest_TechnicianId] ON [InspectionRequest] ([TechnicianId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807085809_AddInspectionRequest'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807085809_AddInspectionRequest', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807090833_AddInspectionReq'
)
BEGIN
    ALTER TABLE [InspectionRequest] DROP CONSTRAINT [FK_InspectionRequest_Technician_TechnicianId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807090833_AddInspectionReq'
)
BEGIN
    DECLARE @var nvarchar(max);
    SELECT @var = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InspectionRequest]') AND [c].[name] = N'TechnicianId');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [InspectionRequest] DROP CONSTRAINT ' + @var + ';');
    ALTER TABLE [InspectionRequest] ALTER COLUMN [TechnicianId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807090833_AddInspectionReq'
)
BEGIN
    DECLARE @var1 nvarchar(max);
    SELECT @var1 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InspectionRequest]') AND [c].[name] = N'ResponseDeadline');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [InspectionRequest] DROP CONSTRAINT ' + @var1 + ';');
    ALTER TABLE [InspectionRequest] ALTER COLUMN [ResponseDeadline] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807090833_AddInspectionReq'
)
BEGIN
    DECLARE @var2 nvarchar(max);
    SELECT @var2 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InspectionRequest]') AND [c].[name] = N'AssignedAt');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [InspectionRequest] DROP CONSTRAINT ' + @var2 + ';');
    ALTER TABLE [InspectionRequest] ALTER COLUMN [AssignedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807090833_AddInspectionReq'
)
BEGIN
    ALTER TABLE [InspectionRequest] ADD CONSTRAINT [FK_InspectionRequest_Technician_TechnicianId] FOREIGN KEY ([TechnicianId]) REFERENCES [Technician] ([TechnicianId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807090833_AddInspectionReq'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807090833_AddInspectionReq', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807153259_Altered_devicetableforuserreference'
)
BEGIN
    CREATE INDEX [IX_Device_UserId] ON [Device] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807153259_Altered_devicetableforuserreference'
)
BEGIN
    ALTER TABLE [Device] ADD CONSTRAINT [FK_Device_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807153259_Altered_devicetableforuserreference'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807153259_Altered_devicetableforuserreference', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808071856_AddInspectionRequestsToDevice'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808071856_AddInspectionRequestsToDevice', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808085333_Added_lifecycleStatusforDeviceTable'
)
BEGIN
    ALTER TABLE [Device] ADD [LifecycleStatus] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808085333_Added_lifecycleStatusforDeviceTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808085333_Added_lifecycleStatusforDeviceTable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808155520_Add_latitiudeandLongitudeforuser'
)
BEGIN
    ALTER TABLE [Users] ADD [Latitude] float NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808155520_Add_latitiudeandLongitudeforuser'
)
BEGIN
    ALTER TABLE [Users] ADD [Longitude] float NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808155520_Add_latitiudeandLongitudeforuser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808155520_Add_latitiudeandLongitudeforuser', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808160058_Added_profilePICTUREforUser'
)
BEGIN
    ALTER TABLE [Users] ADD [ProfileImage] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260808160058_Added_profilePICTUREforUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260808160058_Added_profilePICTUREforUser', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810154458_Added_collectionagentASSIGNMENTtable'
)
BEGIN
    CREATE TABLE [CollectionAssignments] (
        [CollectionAssignmentId] int NOT NULL IDENTITY,
        [DeviceId] int NOT NULL,
        [CollectionAgentId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [AssignedAt] datetime2 NULL,
        [AcceptedAt] datetime2 NULL,
        [PickupStartedAt] datetime2 NULL,
        [PickedUpAt] datetime2 NULL,
        [DeliveredAt] datetime2 NULL,
        [RejectionReason] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_CollectionAssignments] PRIMARY KEY ([CollectionAssignmentId]),
        CONSTRAINT [FK_CollectionAssignments_CollectionAgents_CollectionAgentId] FOREIGN KEY ([CollectionAgentId]) REFERENCES [CollectionAgents] ([CollectionAgentId]),
        CONSTRAINT [FK_CollectionAssignments_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810154458_Added_collectionagentASSIGNMENTtable'
)
BEGIN
    CREATE INDEX [IX_CollectionAssignments_CollectionAgentId] ON [CollectionAssignments] ([CollectionAgentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810154458_Added_collectionagentASSIGNMENTtable'
)
BEGIN
    CREATE INDEX [IX_CollectionAssignments_DeviceId] ON [CollectionAssignments] ([DeviceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810154458_Added_collectionagentASSIGNMENTtable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260810154458_Added_collectionagentASSIGNMENTtable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260810154921_Add_collectionagentallocationtable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260810154921_Add_collectionagentallocationtable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811163120_AddUserPushTokens'
)
BEGIN
    CREATE TABLE [UserPushTokens] (
        [UserPushTokenId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Token] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_UserPushTokens] PRIMARY KEY ([UserPushTokenId]),
        CONSTRAINT [FK_UserPushTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811163120_AddUserPushTokens'
)
BEGIN
    CREATE INDEX [IX_UserPushTokens_UserId] ON [UserPushTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260811163120_AddUserPushTokens'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260811163120_AddUserPushTokens', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260812084742_AddRejectiontable'
)
BEGIN
    CREATE TABLE [AllocationRejections] (
        [RejectionId] int NOT NULL IDENTITY,
        [AllocationType] nvarchar(50) NOT NULL,
        [AllocationId] int NOT NULL,
        [UserId] int NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [RejectedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AllocationRejections] PRIMARY KEY ([RejectionId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260812084742_AddRejectiontable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260812084742_AddRejectiontable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260812090807_allocationrejectiontableRenameuseridtoLOGINid'
)
BEGIN
    EXEC sp_rename N'[AllocationRejections].[UserId]', N'LoginId', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260812090807_allocationrejectiontableRenameuseridtoLOGINid'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260812090807_allocationrejectiontableRenameuseridtoLOGINid', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814092041_updated_collectionagenttable'
)
BEGIN
    ALTER TABLE [CollectionAssignments] DROP CONSTRAINT [FK_CollectionAssignments_CollectionAgents_CollectionAgentId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814092041_updated_collectionagenttable'
)
BEGIN
    DECLARE @var3 nvarchar(max);
    SELECT @var3 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[CollectionAssignments]') AND [c].[name] = N'CollectionAgentId');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [CollectionAssignments] DROP CONSTRAINT ' + @var3 + ';');
    ALTER TABLE [CollectionAssignments] ALTER COLUMN [CollectionAgentId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814092041_updated_collectionagenttable'
)
BEGIN
    ALTER TABLE [CollectionAgents] ADD [VehiclePhoto] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814092041_updated_collectionagenttable'
)
BEGIN
    ALTER TABLE [CollectionAssignments] ADD CONSTRAINT [FK_CollectionAssignments_CollectionAgents_CollectionAgentId] FOREIGN KEY ([CollectionAgentId]) REFERENCES [CollectionAgents] ([CollectionAgentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814092041_updated_collectionagenttable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260814092041_updated_collectionagenttable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815042653_Added_Notificationtable'
)
BEGIN
    CREATE TABLE [Notification] (
        [NotificationId] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Isread] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Notification] PRIMARY KEY ([NotificationId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815042653_Added_Notificationtable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260815042653_Added_Notificationtable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815043055_Updatednotificationtablewithfalsevalue'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260815043055_Updatednotificationtablewithfalsevalue', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815044038_UpdatednotificationtableUseridLoginid'
)
BEGIN
    EXEC sp_rename N'[Notification].[UserId]', N'LoginId', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815044038_UpdatednotificationtableUseridLoginid'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260815044038_UpdatednotificationtableUseridLoginid', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815165513_AddedStatusColumnforNotificationTable'
)
BEGIN
    ALTER TABLE [Notification] ADD [Status] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815165513_AddedStatusColumnforNotificationTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260815165513_AddedStatusColumnforNotificationTable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817162539_Added_wiegthColumn'
)
BEGIN
    ALTER TABLE [Device] ADD [Weight] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260817162539_Added_wiegthColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260817162539_Added_wiegthColumn', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818021738_Created_googleidforLOGINwithGOOGLEforlogintable'
)
BEGIN
    ALTER TABLE [Login] ADD [GoogleId] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818021738_Created_googleidforLOGINwithGOOGLEforlogintable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260818021738_Created_googleidforLOGINwithGOOGLEforlogintable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260823060712_Created_devicemodeltable_and_added_refrecneIN_deviceCategorytable'
)
BEGIN
    CREATE TABLE [DeviceModel] (
        [DeviceModelId] int NOT NULL IDENTITY,
        [CategoryId] int NOT NULL,
        [Brand] nvarchar(100) NOT NULL,
        [Model] nvarchar(150) NOT NULL,
        [ModelNumber] nvarchar(100) NULL,
        [Weight] decimal(8,3) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_DeviceModel] PRIMARY KEY ([DeviceModelId]),
        CONSTRAINT [FK_DeviceModel_DeviceCategory_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [DeviceCategory] ([CategoryId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260823060712_Created_devicemodeltable_and_added_refrecneIN_deviceCategorytable'
)
BEGIN
    CREATE INDEX [IX_DeviceModel_CategoryId] ON [DeviceModel] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260823060712_Created_devicemodeltable_and_added_refrecneIN_deviceCategorytable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260823060712_Created_devicemodeltable_and_added_refrecneIN_deviceCategorytable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260823062055_Created_devicemodeltable_and_added_refrecneIN_deviceCategorytablee'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260823062055_Created_devicemodeltable_and_added_refrecneIN_deviceCategorytablee', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260826043542_Updated_collectionagentassignmentTable_withDeadlineresponseColumn'
)
BEGIN
    ALTER TABLE [CollectionAssignments] ADD [RespondedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260826043542_Updated_collectionagentassignmentTable_withDeadlineresponseColumn'
)
BEGIN
    ALTER TABLE [CollectionAssignments] ADD [ResponseDeadline] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260826043542_Updated_collectionagentassignmentTable_withDeadlineresponseColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260826043542_Updated_collectionagentassignmentTable_withDeadlineresponseColumn', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260826055908_Added_UserRequestButtonfor_ALLOCATION'
)
BEGIN
    ALTER TABLE [Device] ADD [AllocationRequested] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260826055908_Added_UserRequestButtonfor_ALLOCATION'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260826055908_Added_UserRequestButtonfor_ALLOCATION', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827044710_ADDED_pickuptable'
)
BEGIN
    CREATE TABLE [Pickups] (
        [PickupId] int NOT NULL IDENTITY,
        [CollectionAssignmentId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [StartedAt] datetime2 NULL,
        [ArrivedAt] datetime2 NULL,
        [PickedUpAt] datetime2 NULL,
        [DeviceVerified] bit NOT NULL,
        [ProofPhotoPath] nvarchar(500) NULL,
        [AgentNotes] nvarchar(1000) NULL,
        [FailureReason] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Pickups] PRIMARY KEY ([PickupId]),
        CONSTRAINT [FK_Pickups_CollectionAssignments_CollectionAssignmentId] FOREIGN KEY ([CollectionAssignmentId]) REFERENCES [CollectionAssignments] ([CollectionAssignmentId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827044710_ADDED_pickuptable'
)
BEGIN
    CREATE INDEX [IX_Pickups_CollectionAssignmentId] ON [Pickups] ([CollectionAssignmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827044710_ADDED_pickuptable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260827044710_ADDED_pickuptable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827070722_ADDED_qrforDevicetable'
)
BEGIN
    ALTER TABLE [Device] ADD [DeviceQrToken] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827070722_ADDED_qrforDevicetable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260827070722_ADDED_qrforDevicetable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827071337_updated_qrcolumn'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Device_DeviceQrToken] ON [Device] ([DeviceQrToken]) WHERE [DeviceQrToken] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260827071337_updated_qrcolumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260827071337_updated_qrcolumn', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828073805_Added_deliverytable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260828073805_Added_deliverytable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828085510_added_delivery'
)
BEGIN
    CREATE TABLE [Deliveries] (
        [DeliveryId] int NOT NULL IDENTITY,
        [CollectionAssignmentId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [StartedAt] datetime2 NULL,
        [DeliveredAt] datetime2 NULL,
        [DeviceVerified] bit NOT NULL,
        [ProofPhotoPath] nvarchar(500) NULL,
        [AgentNotes] nvarchar(1000) NULL,
        [FailureReason] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Deliveries] PRIMARY KEY ([DeliveryId]),
        CONSTRAINT [FK_Deliveries_CollectionAssignments_CollectionAssignmentId] FOREIGN KEY ([CollectionAssignmentId]) REFERENCES [CollectionAssignments] ([CollectionAssignmentId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828085510_added_delivery'
)
BEGIN
    CREATE INDEX [IX_Deliveries_CollectionAssignmentId] ON [Deliveries] ([CollectionAssignmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828085510_added_delivery'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260828085510_added_delivery', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829094134_updated_deliverytable'
)
BEGIN
    ALTER TABLE [Deliveries] ADD [HandoverRejectedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829094134_updated_deliverytable'
)
BEGIN
    ALTER TABLE [Deliveries] ADD [HandoverRejectionReason] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829094134_updated_deliverytable'
)
BEGIN
    ALTER TABLE [Deliveries] ADD [TechnicianNotes] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829094134_updated_deliverytable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260829094134_updated_deliverytable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    CREATE TABLE [InspectionCriteria] (
        [InspectionCriteriaId] int NOT NULL IDENTITY,
        [CategoryId] int NOT NULL,
        [CriteriaName] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [Weight] decimal(18,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_InspectionCriteria] PRIMARY KEY ([InspectionCriteriaId]),
        CONSTRAINT [FK_InspectionCriteria_DeviceCategory_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [DeviceCategory] ([CategoryId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    CREATE TABLE [InspectionResult] (
        [InspectionResultId] int NOT NULL IDENTITY,
        [InspectionRequestId] int NOT NULL,
        [InspectionCriteriaId] int NOT NULL,
        [Result] nvarchar(100) NOT NULL,
        [Remarks] nvarchar(1000) NULL,
        [Score] decimal(18,2) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_InspectionResult] PRIMARY KEY ([InspectionResultId]),
        CONSTRAINT [FK_InspectionResult_InspectionCriteria_InspectionCriteriaId] FOREIGN KEY ([InspectionCriteriaId]) REFERENCES [InspectionCriteria] ([InspectionCriteriaId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InspectionResult_InspectionRequest_InspectionRequestId] FOREIGN KEY ([InspectionRequestId]) REFERENCES [InspectionRequest] ([InspectionRequestId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    CREATE TABLE [InspectionPhoto] (
        [InspectionPhotoId] int NOT NULL IDENTITY,
        [InspectionResultId] int NOT NULL,
        [PhotoPath] nvarchar(500) NOT NULL,
        [PhotoType] nvarchar(100) NULL,
        [Description] nvarchar(500) NULL,
        [UploadedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_InspectionPhoto] PRIMARY KEY ([InspectionPhotoId]),
        CONSTRAINT [FK_InspectionPhoto_InspectionResult_InspectionResultId] FOREIGN KEY ([InspectionResultId]) REFERENCES [InspectionResult] ([InspectionResultId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    CREATE INDEX [IX_InspectionCriteria_CategoryId] ON [InspectionCriteria] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    CREATE INDEX [IX_InspectionPhoto_InspectionResultId] ON [InspectionPhoto] ([InspectionResultId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    CREATE INDEX [IX_InspectionResult_InspectionCriteriaId] ON [InspectionResult] ([InspectionCriteriaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    CREATE INDEX [IX_InspectionResult_InspectionRequestId] ON [InspectionResult] ([InspectionRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830041431_FixInspectionRelationships'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260830041431_FixInspectionRelationships', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    ALTER TABLE [InspectionResult] DROP CONSTRAINT [FK_InspectionResult_InspectionCriteria_InspectionCriteriaId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    DROP TABLE [InspectionCriteria];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    DROP INDEX [IX_InspectionResult_InspectionCriteriaId] ON [InspectionResult];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    DECLARE @var4 nvarchar(max);
    SELECT @var4 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InspectionResult]') AND [c].[name] = N'InspectionCriteriaId');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [InspectionResult] DROP CONSTRAINT ' + @var4 + ';');
    ALTER TABLE [InspectionResult] DROP COLUMN [InspectionCriteriaId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    ALTER TABLE [InspectionResult] ADD [CriteriaName] nvarchar(100) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    ALTER TABLE [Device] ADD [ProcessingDecision] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    ALTER TABLE [Device] ADD [ProcessingDecisionAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260830083329_updated_devicetablewithinspectionresult'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260830083329_updated_devicetablewithinspectionresult', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903094436_ADD_refurbishmentcenterAllocation_Table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260903094436_ADD_refurbishmentcenterAllocation_Table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903095643_Added_refurbishmentcenterAllocation_Table'
)
BEGIN
    CREATE TABLE [RefurbishmentRequests] (
        [RefurbishmentRequestId] int NOT NULL IDENTITY,
        [DeviceId] int NOT NULL,
        [RefurbishmentCenterId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [AssignedAt] datetime2 NULL,
        [ResponseDeadline] datetime2 NULL,
        [RespondedAt] datetime2 NULL,
        [RejectionReason] nvarchar(500) NULL,
        [RefurbishmentStartedAt] datetime2 NULL,
        [RefurbishmentCompletedAt] datetime2 NULL,
        [ReassignmentCount] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RefurbishmentRequests] PRIMARY KEY ([RefurbishmentRequestId]),
        CONSTRAINT [FK_RefurbishmentRequests_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId] FOREIGN KEY ([RefurbishmentCenterId]) REFERENCES [RefurbishmentCenter] ([RefurbishmentCenterId]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903095643_Added_refurbishmentcenterAllocation_Table'
)
BEGIN
    CREATE INDEX [IX_RefurbishmentRequests_DeviceId] ON [RefurbishmentRequests] ([DeviceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903095643_Added_refurbishmentcenterAllocation_Table'
)
BEGIN
    CREATE INDEX [IX_RefurbishmentRequests_RefurbishmentCenterId] ON [RefurbishmentRequests] ([RefurbishmentCenterId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903095643_Added_refurbishmentcenterAllocation_Table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260903095643_Added_refurbishmentcenterAllocation_Table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    ALTER TABLE [RefurbishmentRequests] DROP CONSTRAINT [FK_RefurbishmentRequests_Device_DeviceId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    ALTER TABLE [RefurbishmentRequests] DROP CONSTRAINT [FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    CREATE TABLE [RecyclingCenterRequests] (
        [RecyclingCenterRequestId] int NOT NULL IDENTITY,
        [DeviceId] int NOT NULL,
        [RecyclingCenterId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [AssignedAt] datetime2 NULL,
        [ResponseDeadline] datetime2 NULL,
        [RespondedAt] datetime2 NULL,
        [RejectionReason] nvarchar(500) NULL,
        [ReassignmentCount] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RecyclingCenterRequests] PRIMARY KEY ([RecyclingCenterRequestId]),
        CONSTRAINT [FK_RecyclingCenterRequests_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId]) ON DELETE CASCADE,
        CONSTRAINT [FK_RecyclingCenterRequests_RecyclingCenter_RecyclingCenterId] FOREIGN KEY ([RecyclingCenterId]) REFERENCES [RecyclingCenter] ([RecyclingCenterId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    CREATE INDEX [IX_RecyclingCenterRequests_DeviceId] ON [RecyclingCenterRequests] ([DeviceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    CREATE INDEX [IX_RecyclingCenterRequests_RecyclingCenterId] ON [RecyclingCenterRequests] ([RecyclingCenterId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    ALTER TABLE [RefurbishmentRequests] ADD CONSTRAINT [FK_RefurbishmentRequests_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    ALTER TABLE [RefurbishmentRequests] ADD CONSTRAINT [FK_RefurbishmentRequests_RefurbishmentCenter_RefurbishmentCenterId] FOREIGN KEY ([RefurbishmentCenterId]) REFERENCES [RefurbishmentCenter] ([RefurbishmentCenterId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903102828_added_recylcingcenter_allocation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260903102828_added_recylcingcenter_allocation', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903103113_added_recyclinprocess_table'
)
BEGIN
    CREATE TABLE [RecyclingProcesses] (
        [RecyclingProcessId] int NOT NULL IDENTITY,
        [RecyclingCenterRequestId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [StartedAt] datetime2 NOT NULL,
        [CompletedAt] datetime2 NULL,
        [TotalRecoveredWeight] decimal(18,2) NULL,
        [TotalMaterialValue] decimal(18,2) NULL,
        [ProcessingCost] decimal(18,2) NULL,
        [NetRecoveryValue] decimal(18,2) NULL,
        [HazardousWasteWeight] decimal(18,2) NULL,
        [HazardousWasteDetails] nvarchar(1000) NULL,
        [DisposalMethod] nvarchar(500) NULL,
        [Notes] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RecyclingProcesses] PRIMARY KEY ([RecyclingProcessId]),
        CONSTRAINT [FK_RecyclingProcesses_RecyclingCenterRequests_RecyclingCenterRequestId] FOREIGN KEY ([RecyclingCenterRequestId]) REFERENCES [RecyclingCenterRequests] ([RecyclingCenterRequestId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903103113_added_recyclinprocess_table'
)
BEGIN
    CREATE INDEX [IX_RecyclingProcesses_RecyclingCenterRequestId] ON [RecyclingProcesses] ([RecyclingCenterRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903103113_added_recyclinprocess_table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260903103113_added_recyclinprocess_table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903103354_added_recoveredmaterials_table'
)
BEGIN
    CREATE TABLE [RecoveredMaterials] (
        [RecoveredMaterialId] int NOT NULL IDENTITY,
        [RecyclingProccessId] int NOT NULL,
        [MaterialName] nvarchar(100) NOT NULL,
        [Quantity] decimal(18,2) NOT NULL,
        [Unit] nvarchar(20) NOT NULL,
        [PricePerUnit] decimal(18,2) NOT NULL,
        [EstimatedValue] decimal(18,2) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_RecoveredMaterials] PRIMARY KEY ([RecoveredMaterialId]),
        CONSTRAINT [FK_RecoveredMaterials_RecyclingProcesses_RecyclingProccessId] FOREIGN KEY ([RecyclingProccessId]) REFERENCES [RecyclingProcesses] ([RecyclingProcessId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903103354_added_recoveredmaterials_table'
)
BEGIN
    CREATE INDEX [IX_RecoveredMaterials_RecyclingProccessId] ON [RecoveredMaterials] ([RecyclingProccessId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903103354_added_recoveredmaterials_table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260903103354_added_recoveredmaterials_table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    ALTER TABLE [InspectionResult] DROP CONSTRAINT [FK_InspectionResult_InspectionRequest_InspectionRequestId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    DECLARE @var5 nvarchar(max);
    SELECT @var5 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InspectionRequest]') AND [c].[name] = N'InspectionCompletedAt');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [InspectionRequest] DROP CONSTRAINT ' + @var5 + ';');
    ALTER TABLE [InspectionRequest] DROP COLUMN [InspectionCompletedAt];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    DECLARE @var6 nvarchar(max);
    SELECT @var6 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InspectionRequest]') AND [c].[name] = N'InspectionDeadline');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [InspectionRequest] DROP CONSTRAINT ' + @var6 + ';');
    ALTER TABLE [InspectionRequest] DROP COLUMN [InspectionDeadline];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    DECLARE @var7 nvarchar(max);
    SELECT @var7 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InspectionRequest]') AND [c].[name] = N'InspectionStartedAt');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [InspectionRequest] DROP CONSTRAINT ' + @var7 + ';');
    ALTER TABLE [InspectionRequest] DROP COLUMN [InspectionStartedAt];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    EXEC sp_rename N'[InspectionResult].[InspectionRequestId]', N'InspectionId', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    EXEC sp_rename N'[InspectionResult].[IX_InspectionResult_InspectionRequestId]', N'IX_InspectionResult_InspectionId', 'INDEX';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    CREATE TABLE [Inspection] (
        [InspectionId] int NOT NULL IDENTITY,
        [InspectionRequestId] int NOT NULL,
        [DeviceId] int NOT NULL,
        [TechnicianId] int NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [InspectionStartedAt] datetime2 NULL,
        [InspectionDeadline] datetime2 NULL,
        [InspectionCompletedAt] datetime2 NULL,
        [OverallScore] decimal(18,2) NULL,
        [OverallCondition] nvarchar(100) NULL,
        [RecommendedAction] nvarchar(100) NULL,
        [TechnicianRemarks] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Inspection] PRIMARY KEY ([InspectionId]),
        CONSTRAINT [FK_Inspection_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId]),
        CONSTRAINT [FK_Inspection_InspectionRequest_InspectionRequestId] FOREIGN KEY ([InspectionRequestId]) REFERENCES [InspectionRequest] ([InspectionRequestId]) ON DELETE CASCADE,
        CONSTRAINT [FK_Inspection_Technician_TechnicianId] FOREIGN KEY ([TechnicianId]) REFERENCES [Technician] ([TechnicianId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    CREATE INDEX [IX_Inspection_DeviceId] ON [Inspection] ([DeviceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    CREATE INDEX [IX_Inspection_InspectionRequestId] ON [Inspection] ([InspectionRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    CREATE INDEX [IX_Inspection_TechnicianId] ON [Inspection] ([TechnicianId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    ALTER TABLE [InspectionResult] ADD CONSTRAINT [FK_InspectionResult_Inspection_InspectionId] FOREIGN KEY ([InspectionId]) REFERENCES [Inspection] ([InspectionId]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260904063312_updated_inspectiontable_inspectionrequest_and_addedNEWinspectionTable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909055443_MakeRecyclingCenterIdNullable'
)
BEGIN
    DECLARE @var8 nvarchar(max);
    SELECT @var8 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RecyclingCenterRequests]') AND [c].[name] = N'RecyclingCenterId');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [RecyclingCenterRequests] DROP CONSTRAINT ' + @var8 + ';');
    ALTER TABLE [RecyclingCenterRequests] ALTER COLUMN [RecyclingCenterId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909055443_MakeRecyclingCenterIdNullable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260909055443_MakeRecyclingCenterIdNullable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909153456_updated_tablefor_findinghardzous_components'
)
BEGIN
    CREATE TABLE [ComponentTypes] (
        [ComponentTypeId] int NOT NULL IDENTITY,
        [ComponentName] nvarchar(100) NOT NULL,
        [HandlingType] nvarchar(50) NOT NULL,
        [Description] nvarchar(500) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ComponentTypes] PRIMARY KEY ([ComponentTypeId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909153456_updated_tablefor_findinghardzous_components'
)
BEGIN
    CREATE TABLE [DeviceModelComponents] (
        [DeviceModelComponentId] int NOT NULL IDENTITY,
        [DeviceModelId] int NOT NULL,
        [ComponentTypeId] int NOT NULL,
        [IsExpected] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_DeviceModelComponents] PRIMARY KEY ([DeviceModelComponentId]),
        CONSTRAINT [FK_DeviceModelComponents_ComponentTypes_ComponentTypeId] FOREIGN KEY ([ComponentTypeId]) REFERENCES [ComponentTypes] ([ComponentTypeId]) ON DELETE CASCADE,
        CONSTRAINT [FK_DeviceModelComponents_DeviceModel_DeviceModelId] FOREIGN KEY ([DeviceModelId]) REFERENCES [DeviceModel] ([DeviceModelId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909153456_updated_tablefor_findinghardzous_components'
)
BEGIN
    CREATE INDEX [IX_DeviceModelComponents_ComponentTypeId] ON [DeviceModelComponents] ([ComponentTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909153456_updated_tablefor_findinghardzous_components'
)
BEGIN
    CREATE INDEX [IX_DeviceModelComponents_DeviceModelId] ON [DeviceModelComponents] ([DeviceModelId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909153456_updated_tablefor_findinghardzous_components'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260909153456_updated_tablefor_findinghardzous_components', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909154446_UpdatedComponentTypeTable'
)
BEGIN
    EXEC sp_rename N'[ComponentTypes].[IsActive]', N'IsHazardous', 'COLUMN';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260909154446_UpdatedComponentTypeTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260909154446_UpdatedComponentTypeTable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910131544_updated_collectionassignment_with_assignmenttype'
)
BEGIN
    CREATE INDEX [IX_Device_DeviceModelId] ON [Device] ([DeviceModelId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910131544_updated_collectionassignment_with_assignmenttype'
)
BEGIN
    ALTER TABLE [Device] ADD CONSTRAINT [FK_Device_DeviceModel_DeviceModelId] FOREIGN KEY ([DeviceModelId]) REFERENCES [DeviceModel] ([DeviceModelId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910131544_updated_collectionassignment_with_assignmenttype'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260910131544_updated_collectionassignment_with_assignmenttype', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910132501_AddRecyclingCenterToCollectionAssignment'
)
BEGIN
    ALTER TABLE [CollectionAssignments] ADD [RecyclingCenterId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910132501_AddRecyclingCenterToCollectionAssignment'
)
BEGIN
    CREATE INDEX [IX_CollectionAssignments_RecyclingCenterId] ON [CollectionAssignments] ([RecyclingCenterId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910132501_AddRecyclingCenterToCollectionAssignment'
)
BEGIN
    ALTER TABLE [CollectionAssignments] ADD CONSTRAINT [FK_CollectionAssignments_RecyclingCenter_RecyclingCenterId] FOREIGN KEY ([RecyclingCenterId]) REFERENCES [RecyclingCenter] ([RecyclingCenterId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910132501_AddRecyclingCenterToCollectionAssignment'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260910132501_AddRecyclingCenterToCollectionAssignment', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911084941_update_devicetablewithPROCESSINGLIFECYCLESTATUS'
)
BEGIN
    ALTER TABLE [Device] ADD [ProcessingLifecycleStatus] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911084941_update_devicetablewithPROCESSINGLIFECYCLESTATUS'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260911084941_update_devicetablewithPROCESSINGLIFECYCLESTATUS', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913043616_added_technicain_penalty_table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260913043616_added_technicain_penalty_table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913044016_updated_inspectiontable_with_newfiled_extensionCOUNT'
)
BEGIN
    ALTER TABLE [Inspection] ADD [ExtensionCount] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913044016_updated_inspectiontable_with_newfiled_extensionCOUNT'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260913044016_updated_inspectiontable_with_newfiled_extensionCOUNT', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913052708_added_technicanpenalty'
)
BEGIN
    CREATE TABLE [technicianPenalties] (
        [TechnicianPenaltyId] int NOT NULL IDENTITY,
        [TechnicianId] int NOT NULL,
        [DeviceId] int NOT NULL,
        [InspectionRequestId] int NULL,
        [PenaltyAmount] decimal(18,2) NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Status] nvarchar(30) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ResolvedAt] datetime2 NULL,
        CONSTRAINT [PK_technicianPenalties] PRIMARY KEY ([TechnicianPenaltyId]),
        CONSTRAINT [FK_technicianPenalties_Device_DeviceId] FOREIGN KEY ([DeviceId]) REFERENCES [Device] ([DeviceId]) ON DELETE CASCADE,
        CONSTRAINT [FK_technicianPenalties_InspectionRequest_InspectionRequestId] FOREIGN KEY ([InspectionRequestId]) REFERENCES [InspectionRequest] ([InspectionRequestId]),
        CONSTRAINT [FK_technicianPenalties_Technician_TechnicianId] FOREIGN KEY ([TechnicianId]) REFERENCES [Technician] ([TechnicianId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913052708_added_technicanpenalty'
)
BEGIN
    CREATE INDEX [IX_technicianPenalties_DeviceId] ON [technicianPenalties] ([DeviceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913052708_added_technicanpenalty'
)
BEGIN
    CREATE INDEX [IX_technicianPenalties_InspectionRequestId] ON [technicianPenalties] ([InspectionRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913052708_added_technicanpenalty'
)
BEGIN
    CREATE INDEX [IX_technicianPenalties_TechnicianId] ON [technicianPenalties] ([TechnicianId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913052708_added_technicanpenalty'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260913052708_added_technicanpenalty', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913120705_added_payement_table'
)
BEGIN
    CREATE TABLE [Payments] (
        [PaymentId] int NOT NULL IDENTITY,
        [PaymentType] nvarchar(50) NOT NULL,
        [ReferenceId] int NULL,
        [PayerType] nvarchar(50) NOT NULL,
        [PayerLoginId] int NULL,
        [ReceiverType] nvarchar(50) NOT NULL,
        [ReceiverLoginId] int NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Currency] nvarchar(10) NOT NULL,
        [TransactionType] nvarchar(20) NOT NULL,
        [PaymentStatus] nvarchar(30) NOT NULL,
        [RazorpayOrderId] nvarchar(100) NULL,
        [RazorpayPaymentId] nvarchar(100) NULL,
        [RazorpaySignature] nvarchar(255) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [PaidAt] datetime2 NULL,
        [FailedAt] datetime2 NULL,
        [FailureReason] nvarchar(500) NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([PaymentId]),
        CONSTRAINT [FK_Payments_Login_PayerLoginId] FOREIGN KEY ([PayerLoginId]) REFERENCES [Login] ([LoginId]),
        CONSTRAINT [FK_Payments_Login_ReceiverLoginId] FOREIGN KEY ([ReceiverLoginId]) REFERENCES [Login] ([LoginId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913120705_added_payement_table'
)
BEGIN
    CREATE INDEX [IX_Payments_PayerLoginId] ON [Payments] ([PayerLoginId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913120705_added_payement_table'
)
BEGIN
    CREATE INDEX [IX_Payments_ReceiverLoginId] ON [Payments] ([ReceiverLoginId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260913120705_added_payement_table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260913120705_added_payement_table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922100056_UpdateMaterialPriceAndDecimalPrecision'
)
BEGIN
    DECLARE @var9 nvarchar(max);
    SELECT @var9 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RecyclingProcesses]') AND [c].[name] = N'TotalRecoveredWeight');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [RecyclingProcesses] DROP CONSTRAINT ' + @var9 + ';');
    ALTER TABLE [RecyclingProcesses] ALTER COLUMN [TotalRecoveredWeight] decimal(18,3) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922100056_UpdateMaterialPriceAndDecimalPrecision'
)
BEGIN
    DECLARE @var10 nvarchar(max);
    SELECT @var10 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RecyclingProcesses]') AND [c].[name] = N'HazardousWasteWeight');
    IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [RecyclingProcesses] DROP CONSTRAINT ' + @var10 + ';');
    ALTER TABLE [RecyclingProcesses] ALTER COLUMN [HazardousWasteWeight] decimal(18,3) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922100056_UpdateMaterialPriceAndDecimalPrecision'
)
BEGIN
    DECLARE @var11 nvarchar(max);
    SELECT @var11 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RecoveredMaterials]') AND [c].[name] = N'Quantity');
    IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [RecoveredMaterials] DROP CONSTRAINT ' + @var11 + ';');
    ALTER TABLE [RecoveredMaterials] ALTER COLUMN [Quantity] decimal(18,3) NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922100056_UpdateMaterialPriceAndDecimalPrecision'
)
BEGIN
    CREATE TABLE [MaterialPrices] (
        [MaterialPriceId] int NOT NULL IDENTITY,
        [ComponentTypeId] int NOT NULL,
        [PricePerKg] decimal(18,2) NOT NULL,
        [EffectiveFrom] datetime2 NOT NULL,
        [EffectiveTo] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_MaterialPrices] PRIMARY KEY ([MaterialPriceId]),
        CONSTRAINT [FK_MaterialPrices_ComponentTypes_ComponentTypeId] FOREIGN KEY ([ComponentTypeId]) REFERENCES [ComponentTypes] ([ComponentTypeId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922100056_UpdateMaterialPriceAndDecimalPrecision'
)
BEGIN
    CREATE INDEX [IX_MaterialPrices_ComponentTypeId] ON [MaterialPrices] ([ComponentTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922100056_UpdateMaterialPriceAndDecimalPrecision'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260922100056_UpdateMaterialPriceAndDecimalPrecision', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [BatteryCondition] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [DataFound] nvarchar(50) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [DispatchDestination] nvarchar(200) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [HazardousComponentsJson] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [HazardousStorageArea] nvarchar(200) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [MissingParts] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [PackagingContainer] nvarchar(200) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [RemovedComponentsJson] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [ResidualWasteWeight] decimal(18,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [SanitizationMethod] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [SanitizationPerformed] nvarchar(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [VisibleDamage] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260923065551_AddFullRecyclingProcessFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260923065551_AddFullRecyclingProcessFields', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928034038_AddRefurbishmentProcessTable'
)
BEGIN
    CREATE TABLE [RefurbishmentProcesses] (
        [RefurbishmentProcessId] int NOT NULL IDENTITY,
        [RefurbishmentRequestId] int NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [StartedAt] datetime2 NOT NULL,
        [CompletedAt] datetime2 NULL,
        [DeviceVerified] bit NOT NULL,
        [VerifiedByTechnician] nvarchar(100) NULL,
        [VerifiedAt] datetime2 NULL,
        [PhysicalCondition] nvarchar(50) NULL,
        [DisplayCondition] nvarchar(50) NULL,
        [BatteryAssessment] nvarchar(50) NULL,
        [KeyboardAssessment] nvarchar(50) NULL,
        [StorageAssessment] nvarchar(50) NULL,
        [RamAssessment] nvarchar(50) NULL,
        [PortsAssessment] nvarchar(50) NULL,
        [SoftwareAssessment] nvarchar(50) NULL,
        [EstimatedRepairCost] decimal(18,2) NULL,
        [AssessmentDecision] nvarchar(50) NULL,
        [DataWiped] bit NOT NULL,
        [WipingMethod] nvarchar(100) NULL,
        [WipingCompletedAt] datetime2 NULL,
        [WipingTechnician] nvarchar(100) NULL,
        [WipingVerificationStatus] nvarchar(50) NULL,
        [CertificateNumber] nvarchar(100) NULL,
        [RepairItemsJson] nvarchar(max) NULL,
        [TotalRepairCost] decimal(18,2) NULL,
        [FunctionalTestsJson] nvarchar(max) NULL,
        [TestingPassed] bit NOT NULL,
        [QcRepairCompleted] bit NOT NULL,
        [QcDataWiped] bit NOT NULL,
        [QcHardwareTested] bit NOT NULL,
        [QcSoftwareTested] bit NOT NULL,
        [QcApproved] bit NOT NULL,
        [QualityGrade] nvarchar(50) NULL,
        [QcInspector] nvarchar(100) NULL,
        [FinalOutcome] nvarchar(50) NULL,
        [RefurbishedValue] decimal(18,2) NULL,
        [WarrantyDuration] nvarchar(50) NULL,
        [RefurbishedCertificateNumber] nvarchar(100) NULL,
        [Remarks] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RefurbishmentProcesses] PRIMARY KEY ([RefurbishmentProcessId]),
        CONSTRAINT [FK_RefurbishmentProcesses_RefurbishmentRequests_RefurbishmentRequestId] FOREIGN KEY ([RefurbishmentRequestId]) REFERENCES [RefurbishmentRequests] ([RefurbishmentRequestId]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928034038_AddRefurbishmentProcessTable'
)
BEGIN
    CREATE INDEX [IX_RefurbishmentProcesses_RefurbishmentRequestId] ON [RefurbishmentProcesses] ([RefurbishmentRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260928034038_AddRefurbishmentProcessTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260928034038_AddRefurbishmentProcessTable', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003043331_added_bankdetailsfeilds_for_user'
)
BEGIN
    ALTER TABLE [Users] ADD [AccountHolder] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003043331_added_bankdetailsfeilds_for_user'
)
BEGIN
    ALTER TABLE [Users] ADD [AccountNumber] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003043331_added_bankdetailsfeilds_for_user'
)
BEGIN
    ALTER TABLE [Users] ADD [BankName] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003043331_added_bankdetailsfeilds_for_user'
)
BEGIN
    ALTER TABLE [Users] ADD [IFSCCode] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003043331_added_bankdetailsfeilds_for_user'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261003043331_added_bankdetailsfeilds_for_user', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003100135_added_payout_table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261003100135_added_payout_table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261003100355_added_ecocycletransaction_table'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261003100355_added_ecocycletransaction_table', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261004085512_updated_devicetablewith_dateofpurchase'
)
BEGIN

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeviceModel]') AND name = 'ReferenceMarketPrice')
                    BEGIN
                        ALTER TABLE [DeviceModel] ADD [ReferenceMarketPrice] decimal(18,2) NOT NULL DEFAULT 0.0;
                    END
                
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261004085512_updated_devicetablewith_dateofpurchase'
)
BEGIN

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeviceModel]') AND name = 'UpdatedAt')
                    BEGIN
                        ALTER TABLE [DeviceModel] ADD [UpdatedAt] datetime2 NULL;
                    END
                
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261004085512_updated_devicetablewith_dateofpurchase'
)
BEGIN

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Device]') AND name = 'PurchaseDate')
                    BEGIN
                        ALTER TABLE [Device] ADD [PurchaseDate] datetime2 NULL;
                    END
                
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261004085512_updated_devicetablewith_dateofpurchase'
)
BEGIN

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
                
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261004085512_updated_devicetablewith_dateofpurchase'
)
BEGIN

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
                
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261004085512_updated_devicetablewith_dateofpurchase'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261004085512_updated_devicetablewith_dateofpurchase', N'10.0.10');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261008164007_SyncProductionSchema'
)
BEGIN
    ALTER TABLE [RecyclingProcesses] ADD [CompletionDeadline] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261008164007_SyncProductionSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261008164007_SyncProductionSchema', N'10.0.10');
END;

COMMIT;
GO

