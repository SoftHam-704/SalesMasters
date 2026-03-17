const { masterPool } = require('./utils/db');

const sql = `
DO $$ 
DECLARE 
    schema_name TEXT;
BEGIN
    -- 1. DROP DAS FUNÇÕES NO SCHEMA PUBLIC
    DROP FUNCTION IF EXISTS public.fn_comparacao_vendas_mensais(integer, integer, integer, integer) CASCADE;
    DROP FUNCTION IF EXISTS public.fn_comparacao_quantidades_mensais(integer, integer, integer, integer) CASCADE;
    DROP FUNCTION IF EXISTS public.get_top_clients(integer, integer, integer, integer, integer) CASCADE;
    
    -- 2. PERCORRE TODOS OS OUTROS SCHEMAS E DROP AS FUNÇÕES CRIADAS
    FOR schema_name IN SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public') LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.fn_comparacao_vendas_mensais(integer, integer, integer, integer) CASCADE', schema_name);
        EXECUTE format('DROP FUNCTION IF EXISTS %I.fn_comparacao_quantidades_mensais(integer, integer, integer, integer) CASCADE', schema_name);
        EXECUTE format('DROP FUNCTION IF EXISTS %I.get_top_clients(integer, integer, integer, integer, integer) CASCADE', schema_name);
        
        -- Também remover assinaturas antigas que podem ter sido criadas por scripts anteriores do dashboard
        EXECUTE format('DROP FUNCTION IF EXISTS %I.fn_comparacao_vendas_mensais(integer, integer, integer) CASCADE', schema_name);
        EXECUTE format('DROP FUNCTION IF EXISTS %I.fn_comparacao_quantidades_mensais(integer, integer, integer) CASCADE', schema_name);
        EXECUTE format('DROP FUNCTION IF EXISTS %I.get_top_clients(integer, integer, integer, integer) CASCADE', schema_name);
        
        RAISE NOTICE 'Schema % limpo no Master DB.', schema_name;
    END LOOP;
END $$;
`;

async function rollback() {
    try {
        console.log('🔙 Iniciando ROLLBACK no banco MASTER (salesmasters_master)...');
        await masterPool.query(sql);
        console.log('✅ Rollback concluído! O banco Master foi limpo das funções de dashboard.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro durante o rollback:', err);
        process.exit(1);
    }
}

rollback();
