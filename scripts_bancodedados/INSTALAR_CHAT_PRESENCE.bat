@echo off
REM =====================================================
REM EXECUTAR SCRIPT DE PRESENÇA DO CHAT
REM Banco: basesales (SaveInCloud)
REM Schema: public (GLOBAL - NÃO replicar por empresa)
REM =====================================================

echo.
echo ========================================================
echo  INSTALACAO DO SISTEMA DE PRESENCA ONLINE - CHAT PRO
echo ========================================================
echo.
echo IMPORTANTE:
echo - Este script sera executado APENAS no schema PUBLIC
echo - NAO replica para schemas de empresas (markpress, rimef, etc.)
echo - O chat e GLOBAL - usuarios de todas empresas conversam
echo.

pause

echo.
echo ========================================================
echo  INSTRUCOES PARA EXECUCAO NO PGADMIN
echo ========================================================
echo.
echo 1. Abra o pgAdmin 4
echo 2. Conecte ao servidor SaveInCloud
echo 3. Navegue ate: basesales -^> Schemas -^> public
echo 4. Clique com botao direito em "public" -^> Query Tool
echo 5. Abra o arquivo que vai aparecer agora
echo 6. Execute o script (F5 ou botao Play)
echo.
echo ========================================================
echo.

REM Abrir a pasta com o script
echo Abrindo pasta com o script SQL...
explorer /select,"%~dp0CHAT_PRESENCE_SYSTEM.sql"

echo.
echo ========================================================
echo  VERIFICACAO POS-INSTALACAO
echo ========================================================
echo.
echo Apos executar o script no pgAdmin, execute estas queries
echo para verificar se tudo foi criado com sucesso:
echo.
echo -- 1. Verificar tabela user_presence
echo SELECT COUNT(*) as total_usuarios FROM public.user_presence;
echo.
echo -- 2. Ver usuarios com presenca
echo SELECT * FROM public.v_users_with_presence LIMIT 10;
echo.
echo -- 3. Verificar funcoes criadas
echo SELECT proname FROM pg_proc WHERE proname LIKE 'fn_%%user%%';
echo.
echo -- 4. Testar marcar usuario 1 como online
echo SELECT fn_set_user_online(1, NULL);
echo.
echo -- 5. Ver status
echo SELECT * FROM user_presence WHERE usuario_id = 1;
echo.
echo ========================================================
echo.

pause

REM Criar arquivo de verificação
echo -- ============================================== > VERIFICAR_INSTALACAO.sql
echo -- QUERIES DE VERIFICACAO DO SISTEMA DE PRESENCA >> VERIFICAR_INSTALACAO.sql
echo -- Execute no pgAdmin apos rodar o script principal >> VERIFICAR_INSTALACAO.sql
echo -- ============================================== >> VERIFICAR_INSTALACAO.sql
echo. >> VERIFICAR_INSTALACAO.sql
echo -- 1. Contar usuarios na tabela de presenca >> VERIFICAR_INSTALACAO.sql
echo SELECT COUNT(*) as total_usuarios FROM public.user_presence; >> VERIFICAR_INSTALACAO.sql
echo. >> VERIFICAR_INSTALACAO.sql
echo -- 2. Ver primeiros 10 usuarios com status >> VERIFICAR_INSTALACAO.sql
echo SELECT * FROM public.v_users_with_presence LIMIT 10; >> VERIFICAR_INSTALACAO.sql
echo. >> VERIFICAR_INSTALACAO.sql
echo -- 3. Listar funcoes criadas >> VERIFICAR_INSTALACAO.sql
echo SELECT proname, prosrc FROM pg_proc WHERE proname LIKE 'fn_%%' AND proname LIKE '%%user%%'; >> VERIFICAR_INSTALACAO.sql
echo. >> VERIFICAR_INSTALACAO.sql
echo -- 4. Testar marcar usuario 1 como online >> VERIFICAR_INSTALACAO.sql
echo SELECT fn_set_user_online(1, NULL); >> VERIFICAR_INSTALACAO.sql
echo. >> VERIFICAR_INSTALACAO.sql
echo -- 5. Ver status do usuario 1 >> VERIFICAR_INSTALACAO.sql
echo SELECT * FROM user_presence WHERE usuario_id = 1; >> VERIFICAR_INSTALACAO.sql
echo. >> VERIFICAR_INSTALACAO.sql
echo -- 6. Contar indices criados >> VERIFICAR_INSTALACAO.sql
echo SELECT indexname FROM pg_indexes WHERE tablename = 'user_presence'; >> VERIFICAR_INSTALACAO.sql

echo.
echo Arquivo de verificacao criado: VERIFICAR_INSTALACAO.sql
echo.
echo ========================================================
echo  FINALIZACAO
echo ========================================================
echo.
echo Proximos passos:
echo 1. Execute CHAT_PRESENCE_SYSTEM.sql no pgAdmin
echo 2. Execute VERIFICAR_INSTALACAO.sql para confirmar
echo 3. Reinicie o backend Node.js (npm run dev)
echo 4. Teste o sistema!
echo.
echo ========================================================

pause
