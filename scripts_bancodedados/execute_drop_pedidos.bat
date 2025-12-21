@echo off
REM ============================================================================
REM SalesMasters - Execute DROP PEDIDOS Script
REM ============================================================================

echo.
echo ========================================
echo  SalesMasters - Drop PEDIDOS Tables
echo ========================================
echo.
echo WARNING: This will permanently delete:
echo   - Table: pedidos
echo   - Table: itens_ped
echo   - All associated sequences and indexes
echo.
echo Press Ctrl+C to cancel or
pause

REM Set PostgreSQL connection parameters
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=basesales
set PGUSER=postgres
set PGPASSWORD=@12Pilabo

echo.
echo Executing DROP script...
echo.

REM Execute the SQL script
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f drop_pedidos_tables.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Tables removed successfully.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo  ERROR! Failed to remove tables.
    echo ========================================
)

echo.
pause
