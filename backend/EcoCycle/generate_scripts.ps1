Add-Type -AssemblyName "System.Data"
$connStr = "Server=(localdb)\MSSQLLocalDB;Database=EcoCycleDB;Integrated Security=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

# ----------------------------------------------------
# 1. Generate 1_fix_schema.sql
# ----------------------------------------------------
$schemaSb = New-Object System.Text.StringBuilder
[void]$schemaSb.AppendLine("-- EcoCycle Fix Schema Script for MonsterASP")
[void]$schemaSb.AppendLine("-- Run this in 'Run T-SQL' to add all missing columns")
[void]$schemaSb.AppendLine("")

$colCmd = $conn.CreateCommand()
$colCmd.CommandText = @"
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS TypeName,
    c.max_length,
    c.precision,
    c.scale,
    c.is_nullable
FROM sys.tables t
JOIN sys.columns c ON t.object_id = c.object_id
JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.is_ms_shipped = 0 AND t.name <> '__EFMigrationsHistory'
ORDER BY t.name, c.column_id
"@

$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($colCmd)
$colsDt = New-Object System.Data.DataTable
[void]$adapter.Fill($colsDt)

foreach ($row in $colsDt.Rows) {
    $tName = $row["TableName"]
    $cName = $row["ColumnName"]
    $type = $row["TypeName"]
    $maxLen = $row["max_length"]
    $prec = $row["precision"]
    $scale = $row["scale"]
    
    $typeDef = $type
    if ($type -match "nvarchar") {
        if ($maxLen -eq -1) { $typeDef = "nvarchar(max)" } else { $typeDef = "nvarchar($($maxLen / 2))" }
    } elseif ($type -match "varchar") {
        if ($maxLen -eq -1) { $typeDef = "varchar(max)" } else { $typeDef = "varchar($maxLen)" }
    } elseif ($type -match "decimal|numeric") {
        $typeDef = "$type($prec, $scale)"
    }

    [void]$schemaSb.AppendLine("IF EXISTS (SELECT * FROM sys.tables WHERE name = '$tName') AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[$tName]') AND name = '$cName') BEGIN ALTER TABLE [$tName] ADD [$cName] $typeDef NULL; END;")
}

$schemaFile = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\1_fix_schema.sql"
[System.IO.File]::WriteAllText($schemaFile, $schemaSb.ToString(), [System.Text.Encoding]::UTF8)

# ----------------------------------------------------
# 2. Generate 2_import_data.sql (and export_data.sql)
# ----------------------------------------------------
$dataSb = New-Object System.Text.StringBuilder
[void]$dataSb.AppendLine("-- EcoCycle Data Import Script for MonsterASP")
[void]$dataSb.AppendLine("")

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
            [void]$dataSb.AppendLine("-- ===========================================")
            [void]$dataSb.AppendLine("-- Table: $tableName ($count rows)")
            [void]$dataSb.AppendLine("-- ===========================================")
            
            $identCmd = $conn.CreateCommand()
            $identCmd.CommandText = "SELECT COUNT(*) FROM sys.identity_columns WHERE object_id = OBJECT_ID('[$tableName]')"
            $hasIdentity = ([int]$identCmd.ExecuteScalar()) -gt 0

            if ($hasIdentity) {
                [void]$dataSb.AppendLine("SET IDENTITY_INSERT [$tableName] ON;")
            }

            $colNames = ($dt.Columns | ForEach-Object { "[$($_.ColumnName)]" }) -join ", "

            # Find primary key column
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
                
                if ($pkCol) {
                    $pkVal = $row[$pkCol]
                    $pkValStr = if ($pkVal -is [string]) { "N'$($pkVal.ToString().Replace("'", "''"))'" } else { $pkVal.ToString() }
                    $innerSql = "IF NOT EXISTS (SELECT 1 FROM [$tableName] WHERE [$pkCol] = $pkValStr) INSERT INTO [$tableName] ($colNames) VALUES ($vals);"
                    $escapedSql = $innerSql.Replace("'", "''")
                    [void]$dataSb.AppendLine("EXEC(N'$escapedSql');")
                } else {
                    $innerSql = "INSERT INTO [$tableName] ($colNames) VALUES ($vals);"
                    $escapedSql = $innerSql.Replace("'", "''")
                    [void]$dataSb.AppendLine("EXEC(N'$escapedSql');")
                }
            }

            if ($hasIdentity) {
                [void]$dataSb.AppendLine("SET IDENTITY_INSERT [$tableName] OFF;")
            }
            [void]$dataSb.AppendLine("")
        }
    } catch {
        $err = $_.Exception.Message
        [void]$dataSb.AppendLine("-- Skipped ${tableName}: ${err}")
    }
}

$conn.Close()

# Write combined export_data.sql (schema + dynamic sql data)
$combinedSb = New-Object System.Text.StringBuilder
[void]$combinedSb.AppendLine($schemaSb.ToString())
[void]$combinedSb.AppendLine($dataSb.ToString())

$dataFile = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\export_data.sql"
[System.IO.File]::WriteAllText($dataFile, $combinedSb.ToString(), [System.Text.Encoding]::UTF8)

$dataFile2 = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\2_import_data.sql"
[System.IO.File]::WriteAllText($dataFile2, $dataSb.ToString(), [System.Text.Encoding]::UTF8)

Write-Output "Successfully generated: $schemaFile and $dataFile"
