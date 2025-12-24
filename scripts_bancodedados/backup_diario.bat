@echo off
REM ============================================
REM Script de Backup Automático - SalesMasters
REM ============================================

REM Configurações
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=@12Pilabo
set PGDATABASE=basesales
set BACKUP_DIR=E:\Backups\SalesMasters
set DATA_ATUAL=%date:~-4%%date:~3,2%%date:~0,2%
set HORA_ATUAL=%time:~0,2%%time:~3,2%
set HORA_ATUAL=%HORA_ATUAL: =0%

REM Criar pasta de backup se não existir
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Nome do arquivo de backup
set BACKUP_FILE=%BACKUP_DIR%\backup_%DATA_ATUAL%_%HORA_ATUAL%.backup

REM Executar backup
echo ============================================
echo SalesMasters - Backup Automatico
echo ============================================
echo Iniciando backup em %date% %time%
echo.

"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U %PGUSER% -d %PGDATABASE% -F c -b -v -f "%BACKUP_FILE%"

REM Verificar se backup foi bem-sucedido
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Backup concluido com sucesso!
    echo Arquivo: %BACKUP_FILE%
    echo ============================================
    echo.
    
    REM Limpar backups antigos (manter últimos 30 dias)
    echo Limpando backups antigos (mantendo ultimos 30 dias)...
    forfiles /p "%BACKUP_DIR%" /s /m *.backup /d -30 /c "cmd /c del @path" 2>nul
    
    echo Limpeza concluida.
    echo.
) else (
    echo.
    echo ============================================
    echo ERRO: Falha no backup!
    echo ============================================
    echo.
    exit /b 1
)

echo Backup finalizado em %date% %time%
pause
