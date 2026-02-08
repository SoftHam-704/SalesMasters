@echo off
REM ============================================================================
REM INSTRUÇÕES PARA EXECUTAR O SCRIPT DE AJUSTE DE SEQUENCES
REM ============================================================================

echo.
echo ========================================================================
echo   AJUSTE DE SEQUENCES - SISTEMA DE REPRESENTACAO COMERCIAL
echo ========================================================================
echo.
echo Este script ajusta as sequences (contadores automaticos) da tabela
echo cad_prod em todos os schemas do sistema de representacao comercial.
echo.
echo IMPORTANTE: Execute este script no pgAdmin (recomendado)
echo.
echo ========================================================================
echo   OPCOES DE EXECUCAO
echo ========================================================================
echo.
echo OPCAO 1 (RECOMENDADA): Via pgAdmin
echo -----------------------------------
echo 1. Abra o pgAdmin
echo 2. Conecte ao servidor: 10.40.40.99
echo 3. Selecione o banco: basesales
echo 4. Abra Query Tool (botao direito no banco ^> Query Tool)
echo 5. Menu: File ^> Open
echo 6. Selecione: FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql
echo 7. Clique em Execute (F5)
echo 8. Aguarde a execucao (aproximadamente 30 segundos)
echo 9. Verifique os resultados no painel Messages
echo.
echo OPCAO 2: Localizar arquivo para copiar/colar
echo ---------------------------------------------
echo.
echo Caminho completo do arquivo:
echo %CD%\scripts_bancodedados\FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql
echo.
echo ========================================================================
echo.
echo Pressione qualquer tecla para abrir a pasta dos scripts...
pause >nul

REM Abrir a pasta dos scripts no Windows Explorer
start "" "%CD%\scripts_bancodedados"

echo.
echo ========================================================================
echo   PASTA ABERTA!
echo ========================================================================
echo.
echo Agora arraste o arquivo FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql
echo para o Query Tool do pgAdmin e execute.
echo.
echo ========================================================================
echo.
pause
