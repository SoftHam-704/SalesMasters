@echo off
echo Parando todos os processos do SalesMasters...

echo.
echo Matando processos Node.js...
taskkill /F /IM node.exe /T 2>NUL
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js parado.
) else (
    echo [INFO] Nenhum processo Node.js encontrado.
)

echo.
echo Matando processos Python...
taskkill /F /IM python.exe /T 2>NUL
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python parado.
) else (
    echo [INFO] Nenhum processo Python encontrado.
)

echo.
echo ==========================================
echo TUDO PARADO!
echo Pode rodar o START_ALL.bat novamente agora.
echo ==========================================
pause
