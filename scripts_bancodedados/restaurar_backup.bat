@echo off
REM ============================================
REM Script de Restauração - SalesMasters
REM ============================================

set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=@12Pilabo
set PGDATABASE=basesales

echo ============================================
echo SalesMasters - Restauracao de Backup
echo ============================================
echo.

REM Solicitar arquivo de backup
set /p BACKUP_FILE="Digite o caminho completo do arquivo de backup: "

REM Verificar se arquivo existe
if not exist "%BACKUP_FILE%" (
    echo.
    echo ERRO: Arquivo nao encontrado!
    echo.
    pause
    exit /b 1
)

REM Confirmar restauração
echo.
echo ============================================
echo ATENCAO: Esta operacao ira SUBSTITUIR
echo todos os dados atuais do banco de dados!
echo ============================================
echo.
echo Arquivo: %BACKUP_FILE%
echo Database: %PGDATABASE%
echo.
set /p CONFIRMA="Deseja continuar? (S/N): "

if /i "%CONFIRMA%" NEQ "S" (
    echo.
    echo Restauracao cancelada.
    echo.
    pause
    exit /b 0
)

echo.
echo Iniciando restauracao...
echo.

REM Desconectar usuários
echo 1. Desconectando usuarios...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U %PGUSER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%PGDATABASE%';" >nul 2>&1

REM Dropar e recriar database
echo 2. Recriando database...
"C:\Program Files\PostgreSQL\16\bin\dropdb.exe" -U %PGUSER% %PGDATABASE% >nul 2>&1
"C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U %PGUSER% %PGDATABASE%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Falha ao recriar database!
    echo.
    pause
    exit /b 1
)

REM Restaurar backup
echo 3. Restaurando backup...
"C:\Program Files\PostgreSQL\16\bin\pg_restore.exe" -U %PGUSER% -d %PGDATABASE% -v "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Restauracao concluida com sucesso!
    echo ============================================
    echo.
) else (
    echo.
    echo ============================================
    echo ERRO: Falha na restauracao!
    echo ============================================
    echo.
    pause
    exit /b 1
)

pause
