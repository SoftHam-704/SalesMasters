$deployDir = "e:\Sistemas_ia\SalesMasters\DEPLOY_READY"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Path $deployDir

# Frontend
Write-Host "Copiando Frontend (dist)..."
Copy-Item -Recurse "e:\Sistemas_ia\SalesMasters\frontend\dist" "$deployDir\frontend"

# Backend
Write-Host "Copiando Backend (excluindo node_modules)..."
New-Item -ItemType Directory -Path "$deployDir\backend"
Get-ChildItem -Path "e:\Sistemas_ia\SalesMasters\backend" -Exclude "node_modules", ".env" | Copy-Item -Recurse -Destination "$deployDir\backend"

# BI Engine
Write-Host "Copiando BI Engine (excluindo venv)..."
New-Item -ItemType Directory -Path "$deployDir\bi-engine"
Get-ChildItem -Path "e:\Sistemas_ia\SalesMasters\bi-engine" -Exclude "venv", "__pycache__", ".env" | Copy-Item -Recurse -Destination "$deployDir\bi-engine"

# PM2 Config
Write-Host "Copiando Configuração PM2..."
Copy-Item "e:\Sistemas_ia\SalesMasters\ecosystem.config.js" "$deployDir\ecosystem.config.js"

Write-Host "Compactando pacote de deploy..."
Compress-Archive -Path "$deployDir\*" -DestinationPath "e:\Sistemas_ia\SalesMasters\SalesMasters_DEPLOY.zip" -Force

Write-Host "✅ Pacote preparado em e:\Sistemas_ia\SalesMasters\DEPLOY_READY"
