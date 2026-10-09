Add-Type -AssemblyName "System.Data"
$connStr = "Server=(localdb)\MSSQLLocalDB;Database=EcoCycleDB;Integrated Security=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ==========================================================================")
[void]$sb.AppendLine("-- EcoCycle Master Migration & Data Sync Script for MonsterASP")
[void]$sb.AppendLine("-- 100% Idempotent, Safe Against Constraints & Existing Data")
[void]$sb.AppendLine("-- ==========================================================================")
[void]$sb.AppendLine("")

# -------------------------------------------------------------------------
# STEP 1: Disable all foreign key constraints during the import
# -------------------------------------------------------------------------
[void]$sb.AppendLine("-- Step 1: Temporarily disable foreign key constraints")
[void]$sb.AppendLine("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';")
[void]$sb.AppendLine("")

# -------------------------------------------------------------------------
# STEP 2: Create all tables that do not exist yet
# -------------------------------------------------------------------------
[void]$sb.AppendLine("-- Step 2: Ensure all tables exist")

$tableNamesCmd = $conn.CreateCommand()
$tableNamesCmd.CommandText = "SELECT name FROM sys.tables WHERE is_ms_shipped = 0 ORDER BY name"
$tblAdapter = New-Object System.Data.SqlClient.SqlDataAdapter($tableNamesCmd)
$tblDt = New-Object System.Data.DataTable
[void]$tblAdapter.Fill($tblDt)

foreach ($tRow in $tblDt.Rows) {
    $t = $tRow["name"]
    
    # Get columns for this table
    $colsCmd = $conn.CreateCommand()
    $colsCmd.CommandText = @"
SELECT 
    c.name AS ColName,
    ty.name AS TypeName,
    c.max_length,
    c.precision,
    c.scale,
    c.is_nullable,
    c.is_identity
FROM sys.columns c
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE c.object_id = OBJECT_ID('[$t]')
ORDER BY c.column_id
"@
    $colsAd = New-Object System.Data.SqlClient.SqlDataAdapter($colsCmd)
    $cDt = New-Object System.Data.DataTable
    [void]$colsAd.Fill($cDt)

    $colDefs = @()
    foreach ($c in $cDt.Rows) {
        $cName = $c["ColName"]
        $type = $c["TypeName"]
        $maxLen = $c["max_length"]
        $prec = $c["precision"]
        $scale = $c["scale"]
        $isIdent = $c["is_identity"]

        $typeDef = $type
        if ($type -match "nvarchar") {
            if ($maxLen -eq -1) { $typeDef = "nvarchar(max)" } else { $typeDef = "nvarchar($($maxLen / 2))" }
        } elseif ($type -match "varchar") {
            if ($maxLen -eq -1) { $typeDef = "varchar(max)" } else { $typeDef = "varchar($maxLen)" }
        } elseif ($type -match "decimal|numeric") {
            $typeDef = "$type($prec, $scale)"
        }

        $identStr = if ($isIdent) { " IDENTITY(1,1)" } else { "" }
        $colDefs += "[$cName] $typeDef$identStr NULL"
    }

    $allColsStr = $colDefs -join ", "
    [void]$sb.AppendLine("IF OBJECT_ID('[$t]', 'U') IS NULL CREATE TABLE [$t] ($allColsStr);")
}

[void]$sb.AppendLine("")

# -------------------------------------------------------------------------
# STEP 3: Add any missing columns & alter existing columns to allow NULLs during migration
# -------------------------------------------------------------------------
[void]$sb.AppendLine("-- Step 3: Add missing columns and relax strict NOT NULLs")

$allColsCmd = $conn.CreateCommand()
$allColsCmd.CommandText = @"
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS TypeName,
    c.max_length,
    c.precision,
    c.scale,
    c.is_identity
FROM sys.tables t
JOIN sys.columns c ON t.object_id = c.object_id
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.is_ms_shipped = 0 AND t.name <> '__EFMigrationsHistory'
ORDER BY t.name, c.column_id
"@

$allColsAd = New-Object System.Data.SqlClient.SqlDataAdapter($allColsCmd)
$allColsDt = New-Object System.Data.DataTable
[void]$allColsAd.Fill($allColsDt)

foreach ($row in $allColsDt.Rows) {
    $tName = $row["TableName"]
    $cName = $row["ColumnName"]
    $type = $row["TypeName"]
    $maxLen = $row["max_length"]
    $prec = $row["precision"]
    $scale = $row["scale"]
    $isIdent = $row["is_identity"]
    
    $typeDef = $type
    if ($type -match "nvarchar") {
        if ($maxLen -eq -1) { $typeDef = "nvarchar(max)" } else { $typeDef = "nvarchar($($maxLen / 2))" }
    } elseif ($type -match "varchar") {
        if ($maxLen -eq -1) { $typeDef = "varchar(max)" } else { $typeDef = "varchar($maxLen)" }
    } elseif ($type -match "decimal|numeric") {
        $typeDef = "$type($prec, $scale)"
    }

    if (-not $isIdent) {
        # Add if missing
        [void]$sb.AppendLine("IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[$tName]') AND name = '$cName') ALTER TABLE [$tName] ADD [$cName] $typeDef NULL;")
        # Alter to NULL if column allows it to prevent column does not allow nulls error
        [void]$sb.AppendLine("IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[$tName]') AND name = '$cName' AND is_nullable = 0) ALTER TABLE [$tName] ALTER COLUMN [$cName] $typeDef NULL;")
    }
}

[void]$sb.AppendLine("")

# -------------------------------------------------------------------------
# STEP 4: Insert all data safely with duplicate checks
# -------------------------------------------------------------------------
[void]$sb.AppendLine("-- Step 4: Insert records")

$tablesOrder = @(
    "Roles",
    "Users",
    "Login",
    "CollectionAgents",
    "Technician",
    "RefurbishmentCenter",
    "RecyclingCenter",
    "DeviceCategory",
    "DeviceModel",
    "ComponentTypes",
    "DeviceModelComponents",
    "MaterialPrices",
    "Device",
    "InspectionRequest",
    "Inspection",
    "InspectionResult",
    "InspectionPhoto",
    "CollectionAssignments",
    "Pickups",
    "Deliveries",
    "RefurbishmentRequests",
    "RefurbishmentProcesses",
    "RecyclingCenterRequests",
    "RecyclingProcesses",
    "RecoveredMaterials",
    "technicianPenalties",
    "Payouts",
    "Payments",
    "EcoCycleTransactions",
    "Notification",
    "UserPushTokens",
    "AllocationRejections"
)

foreach ($tableName in $tablesOrder) {
    try {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT * FROM [$tableName]"
        $dt = New-Object System.Data.DataTable
        $ad = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
        [void]$ad.Fill($dt)

        if ($dt.Rows.Count -gt 0) {
            $count = $dt.Rows.Count
            [void]$sb.AppendLine("-- ===========================================")
            [void]$sb.AppendLine("-- Table: $tableName ($count rows)")
            [void]$sb.AppendLine("-- ===========================================")
            
            $identCmd = $conn.CreateCommand()
            $identCmd.CommandText = "SELECT COUNT(*) FROM sys.identity_columns WHERE object_id = OBJECT_ID('[$tableName]')"
            $hasIdentity = ([int]$identCmd.ExecuteScalar()) -gt 0

            if ($hasIdentity) {
                [void]$sb.AppendLine("SET IDENTITY_INSERT [$tableName] ON;")
            }

            $colNames = ($dt.Columns | ForEach-Object { "[$($_.ColumnName)]" }) -join ", "

            # Find primary key or unique column
            $pkCmd = $conn.CreateCommand()
            $pkCmd.CommandText = @"
SELECT c.name
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('[$tableName]') AND i.is_primary_key = 1
"@
            $pkCol = $pkCmd.ExecuteScalar()

            foreach ($row in $dt.Rows) {
                $valList = @()
                foreach ($col in $dt.Columns) {
                    $val = $row[$col]
                    if ($val -eq [DBNull]::Value -or $null -eq $val) {
                        # Default fallbacks for non-null requirements if needed
                        if ($col.ColumnName -eq "IsActive" -or $col.ColumnName -eq "IsExpected") {
                            $valList += "1"
                        } elseif ($col.ColumnName -eq "ServiceArea") {
                            $valList += "N'General'"
                        } else {
                            $valList += "NULL"
                        }
                    } elseif ($col.DataType -eq [bool]) {
                        $valList += if ($val) { "1" } else { "0" }
                    } elseif ($col.DataType -eq [byte[]]) {
                        $hex = ($val | ForEach-Object { $_.ToString("X2") }) -join ""
                        $valList += "0x$hex"
                    } elseif ($col.DataType -eq [datetime]) {
                        $valList += "'$($val.ToString('yyyy-MM-dd HH:mm:ss.fff'))'"
                    } elseif ($col.DataType.Name -match "Int|Decimal|Double|Single|Byte") {
                        $valList += $val.ToString()
                    } else {
                        $escaped = $val.ToString().Replace("'", "''")
                        $valList += "N'$escaped'"
                    }
                }
                $vals = $valList -join ", "
                
                # Check for duplicates using Primary Key or Unique Email
                if ($tableName -eq "Login") {
                    $emailVal = $row["Email"].ToString().Replace("'", "''")
                    $loginIdVal = $row["LoginId"]
                    $innerSql = "IF NOT EXISTS (SELECT 1 FROM [Login] WHERE [Email] = N'$emailVal' OR [LoginId] = $loginIdVal) INSERT INTO [Login] ($colNames) VALUES ($vals);"
                } elseif ($pkCol) {
                    $pkVal = $row[$pkCol]
                    $pkValStr = if ($pkVal -is [string]) { "N'$($pkVal.ToString().Replace("'", "''"))'" } else { $pkVal.ToString() }
                    $innerSql = "IF NOT EXISTS (SELECT 1 FROM [$tableName] WHERE [$pkCol] = $pkValStr) INSERT INTO [$tableName] ($colNames) VALUES ($vals);"
                } else {
                    $innerSql = "INSERT INTO [$tableName] ($colNames) VALUES ($vals);"
                }
                
                $escapedSql = $innerSql.Replace("'", "''")
                [void]$sb.AppendLine("EXEC(N'$escapedSql');")
            }

            if ($hasIdentity) {
                [void]$sb.AppendLine("SET IDENTITY_INSERT [$tableName] OFF;")
            }
            [void]$sb.AppendLine("")
        }
    } catch {
        $err = $_.Exception.Message
        [void]$sb.AppendLine("-- Skipped ${tableName}: ${err}")
    }
}

# -------------------------------------------------------------------------
# STEP 5: Re-enable foreign key constraints
# -------------------------------------------------------------------------
[void]$sb.AppendLine("-- Step 5: Re-enable foreign key constraints")
[void]$sb.AppendLine("EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all';")
[void]$sb.AppendLine("")

$conn.Close()

$masterFile = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\master_import.sql"
[System.IO.File]::WriteAllText($masterFile, $sb.ToString(), [System.Text.Encoding]::UTF8)

# Also write to 2_import_data.sql so the user can use either name
$file2 = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\2_import_data.sql"
[System.IO.File]::WriteAllText($file2, $sb.ToString(), [System.Text.Encoding]::UTF8)

Write-Output "Successfully generated: $masterFile"
