const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkIteLancto() {
    try {
        const result = await pool.query(`
            SELECT column_name, column_default
            FROM information_schema.columns
            WHERE table_name = 'itens_ped' AND column_name = 'ite_lancto'
        `);
        console.table(result.rows);

        // Verificar maior ite_lancto atual
        const max = await pool.query('SELECT MAX(ite_lancto) as max_val FROM itens_ped');
        console.log(`Maior ite_lancto atual: ${max.rows[0].max_val}`);

    } catch (err) {
        console.error(err.message);
    } finally {
        await pool.end();
    }
}

checkIteLancto();
