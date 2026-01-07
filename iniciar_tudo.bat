@echo off
title SalesMasters Launcher
color 0A

echo ==========================================
echo   INICIANDO SALESMASTERS (DEMO CLOUD)
echo ==========================================
echo.

echo 1. Iniciando BI Engine (Python)...
start "BI Engine Python" /D "e:\Sistemas_ia\SalesMasters\bi-engine" cmd /k "venv\Scripts\python main.py"

echo 2. Iniciando Backend Node.js (Porta 3005)...
start "Backend Server" /D "e:\Sistemas_ia\SalesMasters\backend" cmd /k "node server.js"

echo.
echo Aguardando 5 segundos para os servidores subirem...
timeout /t 5 /nobreak >nul

echo 3. Iniciando Frontend Vite (Porta 5173)...
start "Frontend React" /D "e:\Sistemas_ia\SalesMasters\frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo   TUDO PRONTO!
echo   Acesse: http://localhost:5173/login
echo ==========================================
echo.
pause
