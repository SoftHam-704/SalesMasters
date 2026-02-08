
-- ==============================================================================
-- SALESMASTERS - TRIGGER DE AUTO-NORMALIZAÇÃO PARA ITENS_PED
-- Finalidade: Garantir que todo item inserido já nasça com ite_codigonormalizado
-- Autor: Antigravity Agent
-- Data: 30/01/2026
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    v_schema TEXT;
    v_sql TEXT;
    v_tem_tabela BOOLEAN;
BEGIN
    RAISE NOTICE '🚀 Criando triggers de auto-normalização em todos os schemas...';

    -- 1. Loop pelos schemas
    FOR r IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname NOT IN ('potencial', 'information_schema', 'pg_catalog', 'pg_toast')
          AND nspname NOT LIKE 'pg_temp_%'
    LOOP
        v_schema := r.nspname;
        
        -- 2. Validar se existe a tabela itens_ped
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = v_schema AND table_name = 'itens_ped'
        ) INTO v_tem_tabela;

        IF v_tem_tabela THEN
            RAISE NOTICE '🔧 Schema: %', v_schema;

            -- A. Criar a Trigger Function (uma por schema para evitar problemas de search_path, ou usar a publica)
            -- Vamos usar o encapsulamento: O trigger chama uma função que chama a public.fn_normalizar_codigo
            
            v_sql := format('
                CREATE OR REPLACE FUNCTION %I.trg_fn_auto_normalizar_item()
                RETURNS TRIGGER LANGUAGE plpgsql AS $func$
                BEGIN
                    -- Calcula o código normalizado se o produto foi informado
                    IF NEW.ite_produto IS NOT NULL THEN
                        NEW.ite_codigonormalizado := public.fn_normalizar_codigo(NEW.ite_produto);
                    END IF;
                    RETURN NEW;
                END;
                $func$;
            ', v_schema);
            EXECUTE v_sql;

            -- B. Criar o Trigger
            v_sql := format('
                DROP TRIGGER IF EXISTS trg_auto_normalizar_insert ON %I.itens_ped;
                
                CREATE TRIGGER trg_auto_normalizar_insert
                BEFORE INSERT OR UPDATE OF ite_produto
                ON %I.itens_ped
                FOR EACH ROW
                EXECUTE FUNCTION %I.trg_fn_auto_normalizar_item();
            ', v_schema, v_schema, v_schema);
            EXECUTE v_sql;

            -- C. Atualizar os que já estão nulos agora (Correção Retroativa)
            v_sql := format('
                UPDATE %I.itens_ped
                SET ite_codigonormalizado = public.fn_normalizar_codigo(ite_produto)
                WHERE (ite_codigonormalizado IS NULL OR ite_codigonormalizado = '''')
                  AND ite_produto IS NOT NULL;
            ', v_schema);
            EXECUTE v_sql;

            RAISE NOTICE '   ✅ Trigger criado e dados retroativos corrigidos.';

        END IF;

    END LOOP;

    RAISE NOTICE '🏁 Processo concluído.';
END;
$$;
