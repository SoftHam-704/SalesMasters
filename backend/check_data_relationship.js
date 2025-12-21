const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function check() {
    try {
        console.log('--- Checking cli_aniv ---');
        const countRes = await pool.query('SELECT COUNT(*) FROM cli_aniv');
        console.log('Total contacts:', countRes.rows[0].count);

        const sampleRes = await pool.query('SELECT ani_lancto, ani_cliente, ani_nome FROM cli_aniv LIMIT 5');
        console.log('Sample contacts:', sampleRes.rows);

        const clientIds = sampleRes.rows.map(r => r.ani_cliente);
        if (clientIds.length > 0) {
            const clientsRes = await pool.query('SELECT cli_codigo, cli_nome FROM clientes WHERE cli_codigo = ANY($1::int[])', [clientIds]);
            console.log('Matching clients found:', clientsRes.rows);
        }

        const joinCount = await pool.query('SELECT COUNT(*) FROM cli_aniv a JOIN clientes c ON a.ani_cliente = c.cli_codigo');
        console.log('Total contacts with valid client:', joinCount.rows[0].count);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

check();
