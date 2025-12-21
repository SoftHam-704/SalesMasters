# Script to replace localhost:3001 with localhost:3005 in all frontend files
$files = @(
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\ClientForm.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\SellerForm.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\ClientContactDialog.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\ClientDiscountsTab.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\ClientDiscountDialog.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\ClientIndustryDialog.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\ClientProspectionTab.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\forms\ClientProspectionDialog.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\settings\DataMigration.jsx",
    "e:\Sistemas_ia\SalesMasters\frontend\src\components\settings\DatabaseConfig.jsx"
)

$count = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content -replace 'localhost:3001', 'localhost:3005'
        
        if ($content -ne $newContent) {
            Set-Content $file -Value $newContent -NoNewline
            $count++
            Write-Host "✓ Updated: $file" -ForegroundColor Green
        } else {
            Write-Host "- No changes needed: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ Total files updated: $count" -ForegroundColor Cyan
