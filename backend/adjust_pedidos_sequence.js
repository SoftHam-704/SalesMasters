require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function adjustPedidosSequence() {
    try {
        console.log('🔧 Ajustando sequência gen_pedidos_id...');

        // Buscar o maior ped_numero atual
        const maxResult = await pool.query('SELECT MAX(ped_numero) as max_num FROM pedidos');
        const maxNum = maxResult.rows[0].max_num || 0;

        console.log(`📊 Maior ped_numero atual: ${maxNum}`);

        // Ajustar a sequência para começar no próximo número
        const nextNum = maxNum + 1;
        await pool.query(`SELECT setval('gen_pedidos_id', $1, false)`, [nextNum]);

        console.log(`✅ Sequência ajustada para começar em: ${nextNum}`);

        // Testar
        const testResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
        const testNum = testResult.rows[0].next_num;
        console.log(`🧪 Teste: Próximo número será ${testNum}`);
        console.log(`📝 Próximo pedido será: HS${testNum.toString().padStart(6, '0')}`);

        // Resetar para não consumir o número
        await pool.query(`SELECT setval('gen_pedidos_id', $1, true)`, [maxNum]);
        console.log('✅ Sequência resetada após teste');

    } catch (error) {
        console.error('❌ Erro ao ajustar sequência:', error);
    } finally {
        await pool.end();
    }
}

adjustPedidosSequence();
