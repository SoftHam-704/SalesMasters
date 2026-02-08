-- ==============================================================================
-- SALESMASTERS - SCRIPT DE CORREÇÃO DE NORMALIZAÇÃO E LIMPEZA
-- Finalidade: 
-- 1. Popular pro_codigonormalizado na tabela cad_prod (Global)
-- 2. Remover coluna obsoleta 'ite_normalizado' da itens_ped (Todos os Schemas)
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    v_schema TEXT;
    v_sql TEXT;
    v_col_obsoleta_existe BOOLEAN;
    v_col_nova_existe BOOLEAN;
BEGIN
    -- ------------------------------------------------------------------------------
    -- PARTE 1: ATUALIZAÇÃO DO CADASTRO MASTER DE PRODUTOS
    -- ------------------------------------------------------------------------------
    RAISE NOTICE '🚀 Iniciando normalização do catálogo de produtos (public.cad_prod)...';

    UPDATE public.cad_prod
    SET pro_codigonormalizado = public.fn_normalizar_codigo(pro_codprod)
    WHERE pro_codigonormalizado IS NULL OR pro_codigonormalizado = '';

    RAISE NOTICE '✅ public.cad_prod atualizada com sucesso.';


    -- ------------------------------------------------------------------------------
    -- PARTE 2: LIMPEZA DE COLUNAS OBSOLETAS (ite_normalizado) NOS SCHEMAS
    -- ------------------------------------------------------------------------------
    RAISE NOTICE '🧹 Iniciando limpeza de colunas obsoletas nos schemas de clientes...';

    FOR r IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname NOT IN ('potencial', 'information_schema', 'pg_catalog', 'pg_toast')
          AND nspname NOT LIKE 'pg_temp_%'
    LOOP
        v_schema := r.nspname;
        
        -- Verificar se as colunas existem na tabela itens_ped deste schema
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = v_schema AND table_name = 'itens_ped' AND column_name = 'ite_normalizado'
        ) INTO v_col_obsoleta_existe;

        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = v_schema AND table_name = 'itens_ped' AND column_name = 'ite_codigonormalizado'
        ) INTO v_col_nova_existe;

        -- Lógica de Remoção Segura
        IF v_col_obsoleta_existe THEN
            IF v_col_nova_existe THEN
                -- Cenário Ideal: Tem a nova preenchida (assumindo script anterior) e a velha sobrando.
                RAISE NOTICE '   🗑️ Removendo ite_normalizado de %.itens_ped (ite_codigonormalizado já existe)', v_schema;
                
                v_sql := format('ALTER TABLE %I.itens_ped DROP COLUMN ite_normalizado CASCADE', v_schema);
                EXECUTE v_sql;
            ELSE
                -- Cenário de Risco: Tem a velha mas não a nova.
                RAISE NOTICE '   ⚠️ Schema % tinha apenas ite_normalizado. Migrando para ite_codigonormalizado...', v_schema;
                
                -- 1. Criar coluna nova
                v_sql := format('ALTER TABLE %I.itens_ped ADD COLUMN ite_codigonormalizado character varying(50)', v_schema);
                EXECUTE v_sql;
                
                -- 2. Recalcular via função oficial
                v_sql := format('UPDATE %I.itens_ped SET ite_codigonormalizado = public.fn_normalizar_codigo(ite_produto)', v_schema);
                EXECUTE v_sql;

                -- 3. Dropar a velha
                v_sql := format('ALTER TABLE %I.itens_ped DROP COLUMN ite_normalizado CASCADE', v_schema);
                EXECUTE v_sql;
            END IF;
        END IF;

    END LOOP;

    RAISE NOTICE '🏁 Limpeza concluída.';
END;
$$;
