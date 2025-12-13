@echo off
REM Script para criar o database BaseSales
REM SalesMasters Migration Project

echo ========================================
echo Criando Database BaseSales
echo ========================================
echo.

REM Caminho do PostgreSQL
set PGPATH="C:\Program Files\PostgreSQL\16\bin"

REM Solicitar senha do postgres
set /p PGPASSWORD="Digite a senha do usuario postgres: "

REM Criar database
%PGPATH%\psql -U postgres -c "CREATE DATABASE basesales WITH OWNER = postgres ENCODING = 'UTF8' LC_COLLATE = 'Portuguese_Brazil.1252' LC_CTYPE = 'Portuguese_Brazil.1252' TABLESPACE = pg_default CONNECTION LIMIT = -1 TEMPLATE = template0;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database BaseSales criado com sucesso!
    echo ========================================
    echo.
    
    REM Adicionar comentário
    %PGPATH%\psql -U postgres -c "COMMENT ON DATABASE basesales IS 'SalesMasters - Sistema de Representacao Comercial de Pecas Automotivas';"
    
    echo Comentario adicionado!
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO ao criar database!
    echo ========================================
    echo.
)

pause
