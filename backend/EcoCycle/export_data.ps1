Add-Type -AssemblyName "System.Data"
$connStr = "Server=(localdb)\MSSQLLocalDB;Database=EcoCycleDB;Integrated Security=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

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

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("-- EcoCycle Hosted Database Data Export Script")
[void]$sb.AppendLine("")

foreach ($tableName in $tablesOrder) {
    try {
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT * FROM [$tableName]"
        $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
        $dt = New-Object System.Data.DataTable
        [void]$adapter.Fill($dt)

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
        $msg = $_.Exception.Message
        [void]$sb.AppendLine("-- Skipped ${tableName} : ${msg}")
    }
}

$conn.Close()
$outputFile = "c:\Users\ASUS\ewaste-management\backend\EcoCycle\export_data.sql"
[System.IO.File]::WriteAllText($outputFile, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Successfully generated $outputFile"
