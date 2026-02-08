# Script PowerShell para preparar arquivos de deploy
$DeployDir = ".\deploy_temp"
$BiEngineDir = ".\bi-engine"
$FrontendDir = ".\frontend"

# Limpar pasta de deploy anterior
if (Test-Path $DeployDir) {
    Remove-Item $DeployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DeployDir -Force | Out-Null
New-Item -ItemType Directory -Path "$DeployDir\bi-engine" -Force | Out-Null

Write-Host "Preparando arquivos para deploy..." -ForegroundColor Cyan

# Copiar arquivos do BI Engine (Estrutura completa)
Write-Host "Copiando BI Engine..." -ForegroundColor Cyan
Copy-Item "$BiEngineDir\services" "$DeployDir\bi-engine\" -Recurse -Force
Copy-Item "$BiEngineDir\routers" "$DeployDir\bi-engine\" -Recurse -Force
Copy-Item "$BiEngineDir\utils" "$DeployDir\bi-engine\" -Recurse -Force
Copy-Item "$BiEngineDir\config.py" "$DeployDir\bi-engine\" -Force
Copy-Item "$BiEngineDir\main.py" "$DeployDir\bi-engine\" -Force
Copy-Item "$BiEngineDir\.env" "$DeployDir\bi-engine\" -Force
Copy-Item "$BiEngineDir\requirements.txt" "$DeployDir\bi-engine\" -Force

# Remover __pycache__ para economizar espaço e evitar conflitos
Get-ChildItem -Path "$DeployDir\bi-engine" -Filter "__pycache__" -Recurse | Remove-Item -Recurse -Force

Write-Host "Arquivos BI Engine preparados" -ForegroundColor Green

# Copiar arquivos do Backend Node (server.js e utils)
Write-Host "Copiando Backend Node..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "$DeployDir\backend" -Force | Out-Null
Copy-Item ".\backend\server.js" "$DeployDir\backend\" -Force
Copy-Item ".\backend\utils" "$DeployDir\backend\" -Recurse -Force
Copy-Item ".\backend\.env" "$DeployDir\backend\" -Force
Write-Host "Backend Node preparado" -ForegroundColor Green

# Copiar pasta dist do frontend
Write-Host "Copiando frontend/dist..." -ForegroundColor Cyan
# Antes de copiar, sugerimos rodar: cd frontend && npm run build
if (Test-Path "$FrontendDir\dist") {
    Copy-Item "$FrontendDir\dist" "$DeployDir\frontend_dist" -Recurse -Force
    Write-Host "Frontend/dist copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Pasta frontend/dist não encontrada! Rode 'npm run build' no frontend primeiro." -ForegroundColor Yellow
}

Write-Host "`n🚀 Deploy preparado com SUCESSO em: $DeployDir" -ForegroundColor Cyan
Write-Host "Próximos passos:" -ForegroundColor White
Write-Host "1. Suba o conteúdo de $DeployDir para o ROOT do seu servidor SaveInCloud." -ForegroundColor White
Write-Host "2. No servidor, rode 'pm2 restart server' ou o comando correspondente para reiniciar os serviços." -ForegroundColor White
