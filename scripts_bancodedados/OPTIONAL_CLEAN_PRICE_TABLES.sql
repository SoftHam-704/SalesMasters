-- ============================================================================
-- SCRIPT OPCIONAL - LIMPAR TABELAS DE PREÇOS (TRUNCATE)
-- ⚠️  ATENÇÃO: Este script APAGA todos os dados das tabelas de preços!
-- ============================================================================
-- Database: basesales
-- Schemas de Representação Comercial:
--   - markpress (já foi limpo ontem)
--   - brasil_wl, public, remap, rimef, ro_consult, target
-- ============================================================================
-- Data: 28/01/2026
-- Baseado na correção aplicada no markpress
-- ============================================================================

-- ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️
-- 
-- Este script APAGA TODOS OS PREÇOS dos schemas selecionados!
--
-- Execute este script SOMENTE SE:
-- 1. Você vai reimportar as tabelas de preço do zero
-- 2. Tem certeza que quer apagar os preços atuais
-- 3. Fez backup do banco de dados
--
-- ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️  ATENÇÃO! ⚠️

-- ============================================================================
-- PARTE 1: VERIFICAR QUANTOS REGISTROS SERÃO APAGADOS
-- ============================================================================

SELECT 
    '📊 CONTAGEM DE REGISTROS QUE SERÃO APAGADOS' as etapa;

DO $$
DECLARE
    schema_name TEXT;
    schemas_list TEXT[] := ARRAY['markpress', 'brasil_wl', 'public', 'remap', 'rimef', 'ro_consult', 'target'];
    v_count INTEGER;
    v_total INTEGER := 0;
    v_table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '📊 PREVIEW: Quantidade de registros em cad_tabelaspre por schema';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Schema          | Registros em cad_tabelaspre';
    RAISE NOTICE '----------------|---------------------------';
    
    FOREACH schema_name IN ARRAY schemas_list
    LOOP
        -- Verificar se a tabela existe
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %L AND table_name = ''cad_tabelaspre''
            )', schema_name) INTO v_table_exists;
        
        IF v_table_exists THEN
            EXECUTE format('SELECT COUNT(*) FROM %I.cad_tabelaspre', schema_name) INTO v_count;
            v_total := v_total + v_count;
            
            IF v_count > 0 THEN
                RAISE NOTICE '%-15s | % registros', schema_name, v_count;
            ELSE
                RAISE NOTICE '%-15s | (vazio)', schema_name;
            END IF;
        ELSE
            RAISE NOTICE '%-15s | ⚠️  Tabela não existe', schema_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '----------------|---------------------------';
    RAISE NOTICE 'TOTAL           | % registros serão apagados', v_total;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: markpress já foi limpo ontem, então provavelmente está vazio.';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PARTE 2: CONFIRMAÇÃO (VOCÊ PRECISA DESCOMENTAR PARA EXECUTAR)
-- ============================================================================

-- ⚠️  DESCOMENTE AS LINHAS ABAIXO SOMENTE SE TIVER CERTEZA! ⚠️

/*
DO $$
DECLARE
    schema_name TEXT;
    -- IMPORTANTE: Não incluir 'markpress' pois já foi limpo ontem
    schemas_to_clean TEXT[] := ARRAY['brasil_wl', 'public', 'remap', 'rimef', 'ro_consult', 'target'];
    v_table_exists BOOLEAN;
    v_count_before INTEGER;
    v_count_after INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '🗑️  LIMPANDO TABELAS DE PREÇOS';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    
    FOREACH schema_name IN ARRAY schemas_to_clean
    LOOP
        RAISE NOTICE '------------------------------------------------------------------------';
        RAISE NOTICE '📋 Processando schema: %', UPPER(schema_name);
        
        -- Verificar se a tabela existe
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %L AND table_name = ''cad_tabelaspre''
            )', schema_name) INTO v_table_exists;
        
        IF NOT v_table_exists THEN
            RAISE WARNING '⚠️  Tabela cad_tabelaspre não existe no schema %. Pulando...', schema_name;
            CONTINUE;
        END IF;
        
        BEGIN
            -- Contar registros antes
            EXECUTE format('SELECT COUNT(*) FROM %I.cad_tabelaspre', schema_name) INTO v_count_before;
            RAISE NOTICE '   Registros antes: %', v_count_before;
            
            -- TRUNCATE (apaga todos os registros)
            EXECUTE format('TRUNCATE TABLE %I.cad_tabelaspre', schema_name);
            
            -- Contar registros depois (deve ser 0)
            EXECUTE format('SELECT COUNT(*) FROM %I.cad_tabelaspre', schema_name) INTO v_count_after;
            RAISE NOTICE '   Registros depois: %', v_count_after;
            
            RAISE NOTICE '✅ Tabela % limpa com sucesso! (% registros removidos)', 
                schema_name || '.cad_tabelaspre', v_count_before;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ Erro ao limpar schema %: %', schema_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '✅ LIMPEZA CONCLUÍDA';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Agora você pode importar as tabelas de preço do zero!';
    RAISE NOTICE '';
END $$;

SELECT '✅ Tabelas de preços limpas com sucesso!' as resultado;
*/

-- ============================================================================
-- SE NÃO DESCOMENTOU O BLOCO ACIMA, NADA FOI APAGADO!
-- ============================================================================

SELECT '⚠️  NENHUMA TABELA FOI APAGADA! Descomente o bloco SQL acima para executar a limpeza.' as aviso;

-- ============================================================================
-- INSTRUÇÕES
-- ============================================================================

-- Para executar a limpeza:
-- 1. Faça BACKUP do banco de dados primeiro!
-- 2. Remova o /* e */ que comentam o bloco DO $$ ... END $$
-- 3. Execute este script novamente
--
-- OU
--
-- Se preferir limpar manualmente um schema específico:
-- TRUNCATE TABLE nome_do_schema.cad_tabelaspre;
--
-- Exemplo:
-- TRUNCATE TABLE public.cad_tabelaspre;
-- TRUNCATE TABLE rimef.cad_tabelaspre;
