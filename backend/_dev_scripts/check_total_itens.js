const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkTotalItens() {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM itens_ped');
        console.log(`\n📊 Total final de itens importados: ${result.rows[0].count}`);

        const sample = await pool.query(`
            SELECT ite_pedido, ite_produto, ite_quant, ite_totliquido, ite_data
            FROM itens_ped 
            ORDER BY ite_data DESC 
            LIMIT 5
        `);
        console.log('📋 Últimos itens importados:');
        console.table(sample.rows);

    } catch (err) {
        console.error(err.message);
    } finally {
        await pool.end();
    }
}

checkTotalItens();
