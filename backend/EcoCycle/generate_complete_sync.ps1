Add-Type -AssemblyName "System.Data"
$connStr = "Server=(localdb)\MSSQLLocalDB;Database=EcoCycleDB;Integrated Security=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- EcoCycle Complete Schema & Data Sync Script for MonsterASP")
[void]$sb.AppendLine("")

# Step 1: Ensure all missing columns across all tables are added
[void]$sb.AppendLine("-- =========================================================")
[void]$sb.AppendLine("-- STEP 1: ADD MISSING COLUMNS IF ANY TABLE HAS OLD SCHEMA")
[void]$sb.AppendLine("-- =========================================================")

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

    [void]$sb.AppendLine("IF EXISTS (SELECT * FROM sys.tables WHERE name = '$tName') AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[$tName]') AND name = '$cName') BEGIN ALTER TABLE [$tName] ADD [$cName] $typeDef NULL; END;")
}

[void]$sb.AppendLine("")
[void]$sb.AppendLine("-- =========================================================")
[void]$sb.AppendLine("-- STEP 2: INSERT DATA")
[void]$sb.AppendLine("-- =========================================================")

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
            [void]$sb.AppendLine("-- Table: $tableName ($count rows)")
            
            $identCmd = $conn.CreateCommand()
            $identCmd.CommandText = "SELECT COUNT(*) FROM sys.identity_columns WHERE object_id = OBJECT_ID('[$tableName]')"
            $hasIdentity = ([int]$identCmd.ExecuteScalar()) -gt 0

            if ($hasIdentity) {
                [void]$sb.AppendLine("SET IDENTITY_INSERT [$tableName] ON;")
            }

            $colNames = ($dt.Columns | ForEach-Object { "[$($_.ColumnName)]" }) -join ", "

            # Find primary key column to avoid duplicates
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
                    [void]$sb.AppendLine("IF NOT EXISTS (SELECT 1 FROM [$tableName] WHERE [$pkCol] = $pkValStr) INSERT INTO [$tableName] ($colNames) VALUES ($vals);")
                } else {
                    [void]$sb.AppendLine("INSERT INTO [$tableName] ($colNames) VALUES ($vals);")
                }
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
$outputFile = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\export_data.sql"
[System.IO.File]::WriteAllText($outputFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Successfully generated complete sync script: $outputFile"
