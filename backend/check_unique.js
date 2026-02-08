const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function checkUnique() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- Verificando Unicidade de ped_pedido ---');

        const count = await pool.query('SELECT COUNT(*) FROM repsoma.pedidos');
        const countDistinct = await pool.query('SELECT COUNT(DISTINCT ped_pedido) FROM repsoma.pedidos');

        console.log(`Total Linhas: ${count.rows[0].count}`);
        console.log(`Distinct ped_pedido: ${countDistinct.rows[0].count}`);

        if (count.rows[0].count !== countDistinct.rows[0].count) {
            console.log('⚠️  ped_pedido NÃO é único! A chave deve ser composta (ped_pedido + ped_industria).');

            const countDistinctComp = await pool.query('SELECT COUNT(DISTINCT (ped_pedido, ped_industria)) FROM repsoma.pedidos');
            console.log(`Distinct Composto (pedido + industria): ${countDistinctComp.rows[0].count}`);
        } else {
            console.log('✅ ped_pedido é ÚNICO. Pode ser usado como FK simples.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkUnique();
