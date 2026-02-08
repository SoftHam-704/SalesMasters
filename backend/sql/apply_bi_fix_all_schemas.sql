-- ==============================================================================
-- SALESMASTERS BI - SCRIPT DE CORREÇÃO GERAL (MULTI-TENANT)
-- Finalidade: Aplicar correções de BI em TODOS os schemas de clientes
-- Autor: Antigravity Agent
-- Data: 29/01/2026
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    v_schema TEXT;
    v_sql TEXT;
    v_tem_tabelas BOOLEAN;
BEGIN
    RAISE NOTICE '🚀 Iniciando atualização de BI em todos os schemas...';

    -- 1. Loop pelos schemas (Ignora sistemas e potencial)
    FOR r IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname NOT IN ('potencial', 'information_schema', 'pg_catalog', 'pg_toast')
          AND nspname NOT LIKE 'pg_temp_%'
    LOOP
        v_schema := r.nspname;
        
        -- 2. Validar se é um schema de cliente (tem pedidos e itens_ped)
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = v_schema AND table_name = 'pedidos'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = v_schema AND table_name = 'itens_ped'
        ) INTO v_tem_tabelas;

        IF v_tem_tabelas THEN
            RAISE NOTICE '🔧 Processando schema: %', v_schema;

            -- ----------------------------------------------------
            -- A. NORMALIZAÇÃO DE CÓDIGOS (Se a func existir no public)
            -- ----------------------------------------------------
            BEGIN
                v_sql := format('
                    UPDATE %I.itens_ped 
                    SET ite_codigonormalizado = public.fn_normalizar_codigo(ite_produto) 
                    WHERE ite_codigonormalizado IS NULL OR ite_codigonormalizado = '''';
                ', v_schema);
                EXECUTE v_sql;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '   ⚠️ Pulo normalização em % (Erro ou falta de func)', v_schema;
            END;

            -- ----------------------------------------------------
            -- B. VÍNCULO COM O CATÁLOGO (cad_prod)
            -- ----------------------------------------------------
            BEGIN
                -- Verifica se existe cad_prod no public ou no schema (assumindo public global)
                v_sql := format('
                    UPDATE %I.itens_ped i
                    SET ite_idproduto = p.pro_id
                    FROM public.cad_prod p
                    WHERE i.ite_codigonormalizado = p.pro_codigonormalizado 
                      AND i.ite_industria = p.pro_industria
                      AND (i.ite_idproduto IS NULL);
                ', v_schema);
                EXECUTE v_sql;
                RAISE NOTICE '   ✅ Vínculo de produtos atualizado.';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '   ⚠️ Erro ao vincular produtos em %: %', v_schema, SQLERRM;
            END;

            -- ----------------------------------------------------
            -- C. RECRIAÇÃO DAS VIEWS (vw_performance_mensal)
            -- ----------------------------------------------------
            BEGIN
                v_sql := format('
                    CREATE OR REPLACE VIEW %I.vw_performance_mensal AS
                    SELECT 
                        EXTRACT(year FROM ped_data) AS ano,
                        EXTRACT(month FROM ped_data) AS mes,
                        ped_industria AS industry_id,
                        sum(ped_totliq) AS valor_total,
                        count(DISTINCT ped_numero) AS qtd_pedidos,
                        count(DISTINCT ped_cliente) AS clientes_ativos,
                        avg(ped_totliq) AS ticket_medio
                    FROM %I.pedidos
                    WHERE ped_situacao IN (''P'', ''F'')
                    GROUP BY (EXTRACT(year FROM ped_data)), (EXTRACT(month FROM ped_data)), ped_industria;
                ', v_schema, v_schema);
                EXECUTE v_sql;

                -- View Metricas Cliente
                v_sql := format('
                    CREATE OR REPLACE VIEW %I.vw_metricas_cliente AS
                    SELECT 
                        p.ped_cliente AS cliente_id,
                        c.cli_nomred AS cliente_nome,
                        p.ped_industria AS industry_id,
                        (CURRENT_DATE - max(p.ped_data)) AS dias_sem_compra,
                        sum(p.ped_totliq) AS valor_total,
                        count(p.ped_numero) AS total_pedidos,
                        avg(p.ped_totliq) AS ticket_medio
                    FROM %I.pedidos p
                    JOIN public.clientes c ON p.ped_cliente = c.cli_codigo
                    WHERE p.ped_situacao IN (''P'', ''F'')
                    GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria;
                ', v_schema, v_schema);
                EXECUTE v_sql;
                
                RAISE NOTICE '   ✅ Views recriadas com sucesso.';
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '   ❌ Erro ao criar views em %: %', v_schema, SQLERRM;
            END;

            -- ----------------------------------------------------
            -- D. ANALYZE (Performance)
            -- ----------------------------------------------------
            BEGIN
                v_sql := format('ANALYZE %I.pedidos;', v_schema);
                 EXECUTE v_sql;
                v_sql := format('ANALYZE %I.itens_ped;', v_schema);
                 EXECUTE v_sql;
            END;

        ELSE
            RAISE NOTICE 'Skipping % (not a client schema)', v_schema;
        END IF;

    END LOOP;

    RAISE NOTICE '🏁 Processo concluído para todos os schemas.';
END;
$$;
