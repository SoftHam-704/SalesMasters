const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043'
});

async function applyCRMIndexes() {
    try {
        console.log('--- Iniciando Otimização de Índices CRM ---');

        // 1. Buscar schemas que pertencem ao banco 'basesales'
        const schemasRes = await masterPool.query(`
            SELECT DISTINCT db_schema 
            FROM empresas 
            WHERE db_nome = 'basesales' 
              AND db_schema <> 'potencial'
              AND status = 'ATIVO'
        `);

        const schemas = schemasRes.rows.map(r => r.db_schema);
        // Adicionar o schema 'public' como template
        if (!schemas.includes('public')) schemas.push('public');

        console.log(`Schemas detectados: ${schemas.join(', ')}`);

        // 2. Conectar ao banco basesales
        const salesPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: 'basesales',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || 'postgres'
        });

        for (const schema of schemas) {
            console.log(`\n📦 Otimizando schema: [${schema}]`);
            try {
                await salesPool.query(`SET search_path TO ${schema}, public`);

                // Extension for faster name searching
                try {
                    await salesPool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
                } catch (e) {
                    console.warn(`⚠️ Aviso: Não foi possível criar extensão pg_trgm no schema ${schema} (pode ser falta de permissão superuser).`);
                }

                const indexes = [
                    // crm_interacao
                    { name: 'idx_crm_int_data', table: 'crm_interacao', cols: '(data_interacao DESC)' },
                    { name: 'idx_crm_int_vendedor', table: 'crm_interacao', cols: '(ven_codigo)' },
                    { name: 'idx_crm_int_cliente', table: 'crm_interacao', cols: '(cli_codigo)' },

                    // crm_interacao_industria
                    { name: 'idx_crm_ii_interacao', table: 'crm_interacao_industria', cols: '(interacao_id)' },
                    { name: 'idx_crm_ii_industria', table: 'crm_interacao_industria', cols: '(for_codigo)' },

                    // crm_oportunidades (Pipeline)
                    { name: 'idx_crm_opo_etapa', table: 'crm_oportunidades', cols: '(etapa_id)' },
                    { name: 'idx_crm_opo_vendedor', table: 'crm_oportunidades', cols: '(ven_codigo)' },
                    { name: 'idx_crm_opo_cliente', table: 'crm_oportunidades', cols: '(cli_codigo)' },
                    { name: 'idx_crm_opo_industria', table: 'crm_oportunidades', cols: '(for_codigo)' },

                    // vendedores
                    { name: 'idx_ven_nome_trgm', table: 'vendedores', cols: 'USING gin (ven_nome gin_trgm_ops)' }
                ];

                for (const idx of indexes) {
                    console.log(` - ${idx.name}...`);
                    try {
                        let query = `CREATE INDEX IF NOT EXISTS ${idx.name}_${schema} ON ${idx.table} ${idx.cols}`;
                        await salesPool.query(query);
                    } catch (e) {
                        if (idx.name.includes('trgm')) {
                            console.log(`   └fallback: criando índice B-Tree simples para busca de prefixo.`);
                            await salesPool.query(`CREATE INDEX IF NOT EXISTS ${idx.name}_bf_${schema} ON ${idx.table} (ven_nome)`);
                        } else {
                            console.error(`   └Erro: ${e.message}`);
                        }
                    }
                }

                console.log(`✅ Sucesso para [${schema}]`);
            } catch (err) {
                console.error(`❌ Erro no schema [${schema}]:`, err.message);
            }
        }

        await salesPool.end();
        console.log('\n--- Otimização Concluída ---');

    } catch (error) {
        console.error('❌ Erro Crítico:', error.message);
    } finally {
        await masterPool.end();
    }
}

applyCRMIndexes();
