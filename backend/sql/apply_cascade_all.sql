-- =============================================================================
-- SCRIPT DE AJUSTE INTELIGENTE DE CASCATA (TODOS OS SCHEMAS)
-- Ignora: 'potencial' e schemas de sistema
-- =============================================================================

DO $$
DECLARE
    r RECORD;
    v_sql TEXT;
    v_schema TEXT;
    v_tem_tabelas BOOLEAN;
    v_tem_coluna_industria BOOLEAN;
BEGIN
    RAISE NOTICE 'Iniciando ajuste de CASCADE em todos os schemas (exceto potencial)...';

    -- 1. Loop pelos schemas do banco
    FOR r IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname NOT IN ('potencial', 'information_schema', 'pg_catalog', 'pg_toast')
          AND nspname NOT LIKE 'pg_temp_%'
    LOOP
        v_schema := r.nspname;
        
        -- 2. Verificar se as tabelas pedidos e itens_ped existem neste schema
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = v_schema AND table_name = 'pedidos'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = v_schema AND table_name = 'itens_ped'
        ) INTO v_tem_tabelas;

        IF v_tem_tabelas THEN
            RAISE NOTICE 'Processing schema: %', v_schema;

            -- 3. Verificar se existe a coluna 'ped_industria' (para suportar chave composta)
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = v_schema AND table_name = 'pedidos' AND column_name = 'ped_industria'
            ) INTO v_tem_coluna_industria;

            IF v_tem_coluna_industria THEN
                -- ======================================================
                -- LÓGICA PARA CHAVE COMPOSTA (PEDIDO + INDUSTRIA)
                -- ======================================================
                
                -- A. Remover itens órfãos (Item sem Pedido Pai)
                -- Isso é obrigatório, senão a criação da FK falha
                v_sql := format('
                    DELETE FROM %I.itens_ped i 
                    WHERE NOT EXISTS (
                        SELECT 1 FROM %I.pedidos p 
                        WHERE p.ped_pedido = i.ite_pedido 
                          AND p.ped_industria = i.ite_industria
                    )', v_schema, v_schema);
                EXECUTE v_sql;
                
                -- B. Garantir que Pedidos tenha uma constraint UNIQUE/PK nas colunas compostas
                -- Necessário para validar a FK. Se já existir PK, criamos um indice unique auxiliar se necessário, 
                -- ou confiamos na PK se ela for exatamente essas colunas.
                -- Por segurança, tentamos criar uma UNIQUE CONSTRAINT se não existir.
                BEGIN
                    v_sql := format('ALTER TABLE %I.pedidos ADD CONSTRAINT uk_pedidos_composta_%s UNIQUE (ped_pedido, ped_industria)', v_schema, v_schema);
                    EXECUTE v_sql;
                EXCEPTION WHEN duplicate_table OR others THEN
                    -- Se já existe constraint similar, ignoramos
                    RAISE NOTICE 'Constraint unique ja deve existir ou erro ignoravel em %', v_schema;
                END;

                -- C. Dropar FK antiga se existir (para recriar corretamente)
                BEGIN
                    v_sql := format('ALTER TABLE %I.itens_ped DROP CONSTRAINT IF EXISTS fk_itens_ped_cascade', v_schema);
                    EXECUTE v_sql;
                EXCEPTION WHEN OTHERS THEN NULL; END;

                -- D. Criar a FK com CASCADE
                BEGIN
                    v_sql := format('
                        ALTER TABLE %I.itens_ped 
                        ADD CONSTRAINT fk_itens_ped_cascade 
                        FOREIGN KEY (ite_pedido, ite_industria) 
                        REFERENCES %I.pedidos (ped_pedido, ped_industria) 
                        ON DELETE CASCADE
                    ', v_schema, v_schema);
                    EXECUTE v_sql;
                    RAISE NOTICE '✅ CASCADE aplicado com sucesso em % (Chave Composta)', v_schema;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '❌ Falha ao aplicar FK em % : %', v_schema, SQLERRM;
                END;

            ELSE
                -- ======================================================
                -- LÓGICA PARA CHAVE SIMPLES (APENAS PED_PEDIDO)
                -- ======================================================
                -- Caso exista algum schema antigo sem a coluna industria
                
                -- A. Remover Órfãos
                v_sql := format('
                    DELETE FROM %I.itens_ped i 
                    WHERE NOT EXISTS (
                        SELECT 1 FROM %I.pedidos p 
                        WHERE p.ped_numero = i.ite_pedido_id -- Ajustar conforme nome real da coluna de link se diferente
                        -- Nota: Em muitos sistemas legados, o link pode ser via ped_pedido (string) ou ped_numero (int)
                    )', v_schema, v_schema);
                -- Como não tenho certeza do nome da coluna simples sem industria, vou pular essa parte
                -- para evitar quebrar schemas desconhecidos. O foco são os schemas padrão (repsoma/public/markpress) que têm industria.
                RAISE WARNING '⚠️ Schema % pulado pois nao possui coluna ped_industria. Ajuste manual necessario.', v_schema;
            END IF;

        END IF;
    END LOOP;
    
    RAISE NOTICE 'Processo concluído.';
END;
$$;
