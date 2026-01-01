const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function analyzePedidos() {
    try {
        console.log('📊 Analisando tabela de Pedidos...');

        // 1. Contagem total
        const countRes = await pool.query('SELECT COUNT(*) FROM pedidos');
        console.log(`Total de pedidos: ${countRes.rows[0].count}`);

        // 2. Por Situação
        console.log('\n--- Por Situação ---');
        const situacaoRes = await pool.query(`
            SELECT ped_situacao, COUNT(*) 
            FROM pedidos 
            GROUP BY ped_situacao 
            ORDER BY count DESC
        `);
        console.table(situacaoRes.rows);

        // 3. Por Ano e Situação
        console.log('\n--- Por Ano e Situação ---');
        const anoRes = await pool.query(`
            SELECT 
                EXTRACT(YEAR FROM ped_data) as ano, 
                ped_situacao, 
                COUNT(*) 
            FROM pedidos 
            GROUP BY 1, 2 
            ORDER BY 1 DESC, 3 DESC
        `);
        console.table(anoRes.rows);

        // 4. Verificar se há itens nos pedidos
        console.log('\n--- Verificação de Itens ---');
        const itensRes = await pool.query(`
            SELECT 
                CASE WHEN i.ite_pedido IS NULL THEN 'Sem Itens' ELSE 'Com Itens' END as status_itens,
                COUNT(DISTINCT p.ped_pedido)
            FROM pedidos p
            LEFT JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            GROUP BY 1
        `);
        console.table(itensRes.rows);

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
    }
}

analyzePedidos();
