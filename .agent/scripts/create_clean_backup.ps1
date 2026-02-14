$source = "E:\Sistemas_ia\SalesMasters"
$dateStr = Get-Date -Format "yyyyMMdd_HHmm"
$backupName = "SalesMasters_Backup_$dateStr"
$tempDir = "E:\Sistemas_ia\$backupName"
$zipFile = "E:\Sistemas_ia\SalesMasters_Clean_$dateStr.zip"

Write-Host "Step 1: Preparing backup of $source"
Write-Host "Excluding: node_modules, .git, .next, dist, build, deploy_temp, coverage"

# Create temp dir
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

$excludeDirs = @("node_modules", ".git", ".next", "dist", "build", "deploy_temp", "coverage", ".vscode", ".idea", "__pycache__", "bin", "obj")
$excludeFiles = @("*.log", "*.tmp", "*.bak", "Thumbs.db", ".DS_Store", "yarn-error.log", "npm-debug.log")

Write-Host "Step 2: Copying files to temporary directory..."
# Flatten arguments for robocopy
$robocopyArgs = @($source, $tempDir, "/E", "/XD") + $excludeDirs + @("/XF") + $excludeFiles + @("/R:0", "/W:0", "/NFL", "/NDL", "/NJH", "/NJS")

# Run robocopy
& robocopy $robocopyArgs

if ($LASTEXITCODE -ge 8) {
    Write-Error "Robocopy failed with exit code $LASTEXITCODE"
    exit 1
}

Write-Host "Step 3: Compressing to $zipFile..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -Force

Write-Host "Step 4: Cleaning up temporary directory..."
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "DONE. Backup created at: $zipFile"
Get-Item $zipFile | Select-Object Name, @{Name = "Size(MB)"; Expression = { $_.Length / 1MB } }
