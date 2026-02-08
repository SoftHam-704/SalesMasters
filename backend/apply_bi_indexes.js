
const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD
});

async function applyIndexes() {
    try {
        console.log('--- Iniciando Aplicação de Índices de BI ---');

        // 1. Buscar schemas que pertencem ao banco 'basesales' e não são 'potencial'
        const schemasRes = await masterPool.query(`
            SELECT DISTINCT db_schema 
            FROM empresas 
            WHERE db_nome = 'basesales' 
              AND db_schema <> 'potencial'
              AND status = 'ATIVO'
        `);

        const schemas = schemasRes.rows.map(r => r.db_schema);
        console.log(`Empresas/Schemas detectados: ${schemas.join(', ')}`);

        // 2. Conectar ao banco basesales
        const salesPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: 'basesales',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        for (const schema of schemas) {
            console.log(`\n📦 Aplicando índices no schema: [${schema}]`);
            try {
                // Definir search_path para o schema atual
                await salesPool.query(`SET search_path TO ${schema}, public`);

                // Índices de Cabeçalho de Pedidos
                console.log(` - idx_pedidos_data_situacao...`);
                await salesPool.query(`CREATE INDEX IF NOT EXISTS idx_pedidos_data_situacao_${schema} ON pedidos (ped_data, ped_situacao)`);

                console.log(` - idx_pedidos_cliente...`);
                await salesPool.query(`CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_${schema} ON pedidos (ped_cliente)`);

                console.log(` - idx_pedidos_industria...`);
                await salesPool.query(`CREATE INDEX IF NOT EXISTS idx_pedidos_industria_${schema} ON pedidos (ped_industria)`);

                // Índices de Itens de Pedidos
                console.log(` - idx_itens_ped_pedido...`);
                await salesPool.query(`CREATE INDEX IF NOT EXISTS idx_itens_ped_pedido_${schema} ON itens_ped (ite_pedido)`);

                console.log(` - idx_itens_ped_idproduto...`);
                await salesPool.query(`CREATE INDEX IF NOT EXISTS idx_itens_ped_idproduto_${schema} ON itens_ped (ite_idproduto)`);

                console.log(`✅ Sucesso para [${schema}]`);
            } catch (err) {
                console.error(`❌ Erro no schema [${schema}]:`, err.message);
            }
        }

        await salesPool.end();
        console.log('\n--- Operação Concluída ---');

    } catch (error) {
        console.error('❌ Erro Crítico:', error.message);
    } finally {
        await masterPool.end();
    }
}

applyIndexes();
