$sourceDir = "e:\Sistemas_ia\SalesMasters"
$deployDir = "e:\Sistemas_ia\SalesMasters\DEPLOY_CLEAN"

# Limpa diretório de deploy anterior
if (Test-Path $deployDir) { 
    Write-Host "Limpando diretório de deploy anterior..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $deployDir 
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Função para copiar de forma inteligente usando Robocopy
function Smart-Copy($subPath, $excludeDirs = @(), $excludeFiles = @()) {
    $src = Join-Path $sourceDir $subPath
    $dest = Join-Path $deployDir $subPath
    
    if (!(Test-Path $src)) { return }
    
    Write-Host "Copiando $subPath..." -ForegroundColor Cyan
    
    $params = @($src, $dest, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np")
    if ($excludeDirs.Count -gt 0) {
        $params += "/XD"
        $params += $excludeDirs
    }
    if ($excludeFiles.Count -gt 0) {
        $params += "/XF"
        $params += $excludeFiles
    }
    
    robocopy @params
}

# 1. Frontend (Apenas o build pronto)
Smart-Copy "frontend\dist"

# 2. Backend (Apenas código, sem dependências ou configurações locais)
Smart-Copy "backend" -excludeDirs @("node_modules", ".git", "logs") -excludeFiles @(".env", ".gitignore", "*.log")

# 3. BI Engine (Apenas código Python e serviços)
Smart-Copy "bi-engine" -excludeDirs @("venv", "__pycache__", ".git", ".pytest_cache") -excludeFiles @(".env", ".gitignore", "*.pyc")

# 4. Mobile
Smart-Copy "mobile" -excludeDirs @("node_modules", ".git") -excludeFiles @(".env")

# 5. Configurações de Servidor
Copy-Item "$sourceDir\ecosystem.config.js" "$deployDir\ecosystem.config.js"

Write-Host "`n✅ Deploy preparado com SUCESSO em: $deployDir" -ForegroundColor Green
Write-Host "Os arquivos foram copiados cirurgicamente, sem venv, node_modules ou arquivos de configuração sensíveis." -ForegroundColor Gray
