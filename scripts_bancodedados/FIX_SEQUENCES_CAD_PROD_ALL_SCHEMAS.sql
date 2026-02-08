-- ============================================================================
-- SCRIPT DE CORREÇÃO - AJUSTAR SEQUENCES DOS SCHEMAS
-- Problema: Violation key ao importar produtos (sequence desatualizada)
-- ============================================================================
-- Database: basesales
-- Schemas de Representação Comercial:
--   - markpress (MODELO PADRÃO - já corrigido ontem)
--   - brasil_wl, public, remap, rimef, ro_consult, target
-- ============================================================================
-- Data: 28/01/2026
-- Baseado na correção aplicada no markpress
-- ============================================================================

-- PROBLEMA IDENTIFICADO:
-- ----------------------
-- A sequence gen_cad_prod_id (contador automático de IDs) estava gerando
-- números que JÁ EXISTIAM na tabela cad_prod, causando erro de "duplicate key"
--
-- SOLUÇÃO APLICADA NO MARKPRESS:
-- 1. Ajustar sequence para MAX(pro_id) + 1
-- 2. Limpar tabela de preços (TRUNCATE cad_tabelaspre)
--
-- ESTE SCRIPT REPLICA ESSA CORREÇÃO PARA OS DEMAIS SCHEMAS

-- ============================================================================
-- PARTE 1: VERIFICAR SITUAÇÃO ATUAL DAS SEQUENCES
-- ============================================================================

SELECT 
    '🔵 VERIFICANDO SEQUENCES EM TODOS OS SCHEMAS' as etapa;

DO $$
DECLARE
    schema_name TEXT;
    schemas_list TEXT[] := ARRAY['markpress', 'brasil_wl', 'public', 'remap', 'rimef', 'ro_consult', 'target'];
    v_max_id INTEGER;
    v_seq_value BIGINT;
    v_seq_name TEXT;
    v_table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '📊 DIAGNÓSTICO: Comparando MAX(pro_id) com valor atual da sequence';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Schema          | MAX(pro_id) | Sequence Atual | Status';
    RAISE NOTICE '----------------|-------------|----------------|------------------';
    
    FOREACH schema_name IN ARRAY schemas_list
    LOOP
        -- Verificar se a tabela existe
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %L AND table_name = ''cad_prod''
            )', schema_name) INTO v_table_exists;
        
        IF NOT v_table_exists THEN
            RAISE NOTICE '%-15s | N/A         | N/A            | ⚠️  Tabela não existe', schema_name;
            CONTINUE;
        END IF;
        
        -- Buscar MAX(pro_id)
        EXECUTE format('SELECT COALESCE(MAX(pro_id), 0) FROM %I.cad_prod', schema_name) INTO v_max_id;
        
        -- Buscar sequence associada
        EXECUTE format('SELECT pg_get_serial_sequence(%L, ''pro_id'')', schema_name || '.cad_prod') INTO v_seq_name;
        
        IF v_seq_name IS NOT NULL THEN
            -- Pegar valor atual da sequence
            EXECUTE format('SELECT last_value FROM %s', v_seq_name) INTO v_seq_value;
            
            -- Comparar e mostrar status
            IF v_seq_value <= v_max_id THEN
                RAISE NOTICE '%-15s | %-11s | %-14s | ❌ DESATUALIZADA!', 
                    schema_name, v_max_id, v_seq_value;
            ELSE
                RAISE NOTICE '%-15s | %-11s | %-14s | ✅ OK', 
                    schema_name, v_max_id, v_seq_value;
            END IF;
        ELSE
            -- Tentar sequence pública (fallback)
            BEGIN
                SELECT last_value FROM public.gen_cad_prod_id INTO v_seq_value;
                RAISE NOTICE '%-15s | %-11s | %-14s | ⚠️  Usando gen_cad_prod_id (public)', 
                    schema_name, v_max_id, v_seq_value;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '%-15s | %-11s | N/A            | ⚠️  Sequence não encontrada', 
                    schema_name, v_max_id;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
END $$;

-- ============================================================================
-- PARTE 2: APLICAR CORREÇÃO NOS SCHEMAS (IGUAL AO MARKPRESS)
-- ============================================================================

DO $$
DECLARE
    schema_name TEXT;
    -- IMPORTANTE: Não incluir 'markpress' pois já foi corrigido
    schemas_to_fix TEXT[] := ARRAY['brasil_wl', 'public', 'remap', 'rimef', 'ro_consult', 'target'];
    v_max_id INTEGER;
    v_seq_name TEXT;
    v_table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '🔧 AJUSTANDO SEQUENCES NOS SCHEMAS';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE 'Modelo padrão: MARKPRESS (já corrigido ontem)';
    RAISE NOTICE '';
    
    FOREACH schema_name IN ARRAY schemas_to_fix
    LOOP
        RAISE NOTICE '------------------------------------------------------------------------';
        RAISE NOTICE '📋 Processando schema: %', UPPER(schema_name);
        RAISE NOTICE '------------------------------------------------------------------------';
        
        -- Verificar se a tabela cad_prod existe
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %L AND table_name = ''cad_prod''
            )', schema_name) INTO v_table_exists;
        
        IF NOT v_table_exists THEN
            RAISE WARNING '⚠️  Tabela cad_prod não existe no schema %. Pulando...', schema_name;
            CONTINUE;
        END IF;
        
        BEGIN
            -- Passo 1: Buscar o maior ID atual
            EXECUTE format('SELECT COALESCE(MAX(pro_id), 0) FROM %I.cad_prod', schema_name) INTO v_max_id;
            RAISE NOTICE '   Maior pro_id encontrado: %', v_max_id;
            
            -- Passo 2: Descobrir qual sequence controla essa coluna
            EXECUTE format('SELECT pg_get_serial_sequence(%L, ''pro_id'')', schema_name || '.cad_prod') INTO v_seq_name;
            
            IF v_seq_name IS NOT NULL THEN
                -- Ajustar a sequence para o próximo valor disponível
                EXECUTE format('SELECT setval(%L, %s)', v_seq_name, v_max_id + 1);
                RAISE NOTICE '✅ Sequence % ajustada para: %', v_seq_name, v_max_id + 1;
            ELSE
                -- Fallback: tentar ajustar a sequence pública
                RAISE WARNING '⚠️  Sequence específica não encontrada. Tentando public.gen_cad_prod_id...';
                
                IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'gen_cad_prod_id' AND relkind = 'S') THEN
                    PERFORM setval('public.gen_cad_prod_id', v_max_id + 1, false);
                    RAISE NOTICE '✅ Sequence public.gen_cad_prod_id ajustada para: %', v_max_id + 1;
                ELSE
                    RAISE WARNING '❌ Sequence não encontrada! Schema % precisa de atenção manual.', schema_name;
                END IF;
            END IF;
            
            RAISE NOTICE '✅ Schema % processado com sucesso!', UPPER(schema_name);
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ Erro ao processar schema %: %', schema_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '✅ AJUSTE DE SEQUENCES CONCLUÍDO';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PARTE 3: VERIFICAÇÃO PÓS-EXECUÇÃO
-- ============================================================================

SELECT 
    '🔍 VERIFICAÇÃO PÓS-AJUSTE' as etapa;

DO $$
DECLARE
    schema_name TEXT;
    schemas_list TEXT[] := ARRAY['markpress', 'brasil_wl', 'public', 'remap', 'rimef', 'ro_consult', 'target'];
    v_max_id INTEGER;
    v_seq_value BIGINT;
    v_seq_name TEXT;
    v_table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '📊 VERIFICAÇÃO FINAL: Todas as sequences devem estar OK agora';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Schema          | MAX(pro_id) | Sequence Atual | Status';
    RAISE NOTICE '----------------|-------------|----------------|------------------';
    
    FOREACH schema_name IN ARRAY schemas_list
    LOOP
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %L AND table_name = ''cad_prod''
            )', schema_name) INTO v_table_exists;
        
        IF NOT v_table_exists THEN
            RAISE NOTICE '%-15s | N/A         | N/A            | ⚠️  Tabela não existe', schema_name;
            CONTINUE;
        END IF;
        
        EXECUTE format('SELECT COALESCE(MAX(pro_id), 0) FROM %I.cad_prod', schema_name) INTO v_max_id;
        EXECUTE format('SELECT pg_get_serial_sequence(%L, ''pro_id'')', schema_name || '.cad_prod') INTO v_seq_name;
        
        IF v_seq_name IS NOT NULL THEN
            EXECUTE format('SELECT last_value FROM %s', v_seq_name) INTO v_seq_value;
            
            IF v_seq_value > v_max_id THEN
                RAISE NOTICE '%-15s | %-11s | %-14s | ✅ OK', 
                    schema_name, v_max_id, v_seq_value;
            ELSE
                RAISE NOTICE '%-15s | %-11s | %-14s | ❌ AINDA DESATUALIZADA', 
                    schema_name, v_max_id, v_seq_value;
            END IF;
        ELSE
            BEGIN
                SELECT last_value FROM public.gen_cad_prod_id INTO v_seq_value;
                RAISE NOTICE '%-15s | %-11s | %-14s | ⚠️  Usando sequence pública', 
                    schema_name, v_max_id, v_seq_value;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '%-15s | %-11s | N/A            | ⚠️  Sequence não encontrada', 
                    schema_name, v_max_id;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
END $$;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Este script ajusta APENAS as sequences (contadores de ID)
-- 2. NÃO limpa as tabelas de preços automaticamente (veja próximo script)
-- 3. Baseado na correção aplicada ontem no schema markpress
-- 4. Schemas já corretos são ignorados

SELECT '✅ Script de ajuste de sequences executado com sucesso!' as resultado;
