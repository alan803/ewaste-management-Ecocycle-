Add-Type -AssemblyName "System.Data"
$connStr = "Server=(localdb)\MSSQLLocalDB;Database=EcoCycleDB;Integrated Security=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- ==========================================================================")
[void]$sb.AppendLine("-- EcoCycle Clean Data Sync Script for MonsterASP")
[void]$sb.AppendLine("-- ==========================================================================")
[void]$sb.AppendLine("")

# Disable all FK constraints
[void]$sb.AppendLine("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all';")
[void]$sb.AppendLine("")

# Ensure missing tables exist
$tableNamesCmd = $conn.CreateCommand()
$tableNamesCmd.CommandText = "SELECT name FROM sys.tables WHERE is_ms_shipped = 0 ORDER BY name"
$tblAdapter = New-Object System.Data.SqlClient.SqlDataAdapter($tableNamesCmd)
$tblDt = New-Object System.Data.DataTable
[void]$tblAdapter.Fill($tblDt)

foreach ($tRow in $tblDt.Rows) {
    $t = $tRow["name"]
    
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

        if ($isIdent) {
            $colDefs += "[$cName] $typeDef IDENTITY(1,1) NOT NULL"
        } else {
            $colDefs += "[$cName] $typeDef NULL"
        }
    }

    $allColsStr = $colDefs -join ", "
    [void]$sb.AppendLine("IF OBJECT_ID('[$t]', 'U') IS NULL CREATE TABLE [$t] ($allColsStr);")
}

[void]$sb.AppendLine("")

# Tables in logical insertion order
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

            foreach ($row in $dt.Rows) {
                $valList = @()
                foreach ($col in $dt.Columns) {
                    $val = $row[$col]
                    if ($val -eq [DBNull]::Value -or $null -eq $val) {
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

# Re-enable FKs
[void]$sb.AppendLine("EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all';")
[void]$sb.AppendLine("")

$conn.Close()

$finalFile = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\clean_import.sql"
[System.IO.File]::WriteAllText($finalFile, $sb.ToString(), [System.Text.Encoding]::UTF8)

# Also overwrite export_data.sql and 2_import_data.sql
[System.IO.File]::WriteAllText("c:\Users\ASUS\ewaste-management\backend\EcoCycle\export_data.sql", $sb.ToString(), [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText("c:\Users\ASUS\ewaste-management\backend\EcoCycle\2_import_data.sql", $sb.ToString(), [System.Text.Encoding]::UTF8)

Write-Output "Successfully generated: $finalFile"
