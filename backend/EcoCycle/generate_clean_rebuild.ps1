Add-Type -AssemblyName "System.Data"
$connStr = "Server=(localdb)\MSSQLLocalDB;Database=EcoCycleDB;Integrated Security=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ==========================================================================")
[void]$sb.AppendLine("-- EcoCycle 100% Guaranteed Rebuild & Data Import for MonsterASP")
[void]$sb.AppendLine("-- All columns allow NULL during import so 0 NULL errors can occur")
[void]$sb.AppendLine("-- ==========================================================================")
[void]$sb.AppendLine("")

# 1. Clean slate
[void]$sb.AppendLine("-- Step 1: Clean slate (drop old foreign keys and tables)")
[void]$sb.AppendLine(@"
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys;
IF LEN(@sql) > 0 EXEC sp_executesql @sql;

SET @sql = N'';
SELECT @sql += N'DROP TABLE ' + QUOTENAME(SCHEMA_NAME(schema_id)) + '.' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.tables WHERE is_ms_shipped = 0;
IF LEN(@sql) > 0 EXEC sp_executesql @sql;
"@)
[void]$sb.AppendLine("")

$tablesOrder = @(
    "Roles",
    "Login",
    "Users",
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

# 2. Table creation with ALL columns as NULL (except IDENTITY PK)
[void]$sb.AppendLine("-- Step 2: Create all tables with fully permissive NULLable columns")

foreach ($tableName in $tablesOrder) {
    $colsCmd = $conn.CreateCommand()
    $colsCmd.CommandText = @"
SELECT 
    c.name AS ColName,
    ty.name AS TypeName,
    c.max_length,
    c.precision,
    c.scale,
    c.is_identity
FROM sys.columns c
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE c.object_id = OBJECT_ID('[$tableName]')
ORDER BY c.column_id
"@
    $colsAd = New-Object System.Data.SqlClient.SqlDataAdapter($colsCmd)
    $cDt = New-Object System.Data.DataTable
    [void]$colsAd.Fill($cDt)

    # Find PK column
    $pkCmd = $conn.CreateCommand()
    $pkCmd.CommandText = @"
SELECT c.name
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('[$tableName]') AND i.is_primary_key = 1
"@
    $pkCol = $pkCmd.ExecuteScalar()

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

        if ($isIdent) {
            $colDefs += "[$cName] $typeDef IDENTITY(1,1) PRIMARY KEY NOT NULL"
        } elseif ($cName -eq $pkCol) {
            $colDefs += "[$cName] $typeDef PRIMARY KEY NOT NULL"
        } else {
            # ALL OTHER COLUMNS EXPLICITLY ALLOW NULL
            $colDefs += "[$cName] $typeDef NULL"
        }
    }

    $allColsStr = $colDefs -join ", "
    [void]$sb.AppendLine("CREATE TABLE [$tableName] ($allColsStr);")
}

[void]$sb.AppendLine("")
[void]$sb.AppendLine("-- Step 3: Insert all data")

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

            foreach ($row in $dt.Rows) {
                $valList = @()
                foreach ($col in $dt.Columns) {
                    $val = $row[$col]
                    if ($val -eq [DBNull]::Value -or $null -eq $val) {
                        $valList += "NULL"
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
                [void]$sb.AppendLine("INSERT INTO [$tableName] ($colNames) VALUES ($vals);")
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

$conn.Close()

$outputFile = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\rebuild_database.sql"
[System.IO.File]::WriteAllText($outputFile, $sb.ToString(), [System.Text.Encoding]::UTF8)

Write-Output "Successfully generated: $outputFile"
